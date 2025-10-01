import { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import {
  CallNextRequest,
  CreateTicketRequest,
  DisplayResponse,
  DisplayRow,
  QueueEvent,
  QueueSnapshot,
  ServiceType,
  Ticket,
  TransferRequest,
  WindowState,
  formatTicketCode,
} from "../../shared/api";
import { isDbEnabled, listWindowsDb, createTicketDb, callNextDb, recallDb, completeDb, skipDb, transferDb, displayRowsDb, seedDemoDb } from "../store/db";

// In-memory store (can be swapped with DB adapter)
const WINDOWS_COUNT = 6;
const SERVICES: ServiceType[] = ["S1", "S2", "S3"];

const windows: WindowState[] = Array.from({ length: WINDOWS_COUNT }, (_, i) => ({
  id: i + 1,
  name: `Window ${i + 1}`,
  currentTicketId: null,
  busy: false,
  updatedAt: Date.now(),
}));

const tickets: Record<string, Ticket> = {};
const queues: Record<ServiceType, { nextNumber: number; waitingIds: string[] }> = {
  S1: { nextNumber: 1, waitingIds: [] },
  S2: { nextNumber: 1, waitingIds: [] },
  S3: { nextNumber: 1, waitingIds: [] },
};

// Simple SSE hub
const sseClients = new Set<{ id: string; res: any }>();
function sendSSE(ev: QueueEvent) {
  const data = `event: ${ev.type}\n` + `data: ${JSON.stringify(ev.payload)}\n\n`;
  for (const { res } of sseClients) res.write(data);
}

function snapshot(): QueueSnapshot {
  return { windows, services: queues, tickets };
}


function enqueue(service: ServiceType, notes?: string, ownerName?: string, woreda?: string): Ticket {
  const number = queues[service].nextNumber++;
  const id = randomUUID();
  const t: Ticket = {
    id,
    service,
    number,
    code: formatTicketCode(service, number),
    status: "waiting",
    windowId: null,
    createdAt: Date.now(),
    notes,
    ownerName,
    woreda,
  };
  tickets[id] = t;
  queues[service].waitingIds.push(id);
  sendSSE({ type: "ticket.created", payload: t });
  updateDisplay();
  return t;
}

function pickNext(service: ServiceType): Ticket | null {
  const id = queues[service].waitingIds.shift();
  if (!id) return null;
  return tickets[id] ?? null;
}

function updateDisplay() {
  const rows: DisplayRow[] = SERVICES.map((s) => {
    const nowServing = windows
      .filter((w) => w.currentTicketId)
      .map((w) => ({ w, t: w.currentTicketId ? tickets[w.currentTicketId] : null }))
      .filter((x) => x.t && x.t!.service === s)
      .map(({ w, t }) => ({ code: t!.code, windowId: w.id }))[0] ?? {
      code: null,
      windowId: null,
    };
    const next = queues[s].waitingIds.length
      ? tickets[queues[s].waitingIds[0]].code
      : null;
    return { service: s, nowServing, next };
  });
  sendSSE({ type: "display.updated", payload: rows });
  return rows;
}

export const sseHandler: RequestHandler = (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const client = { id: randomUUID(), res };
  sseClients.add(client);
  const init: QueueEvent = { type: "init", payload: snapshot() };
  res.write(`event: ${init.type}\n` + `data: ${JSON.stringify(init.payload)}\n\n`);

  req.on("close", () => {
    sseClients.delete(client);
  });
};

export const createTicket: RequestHandler = async (req, res) => {
  const { service, notes, ownerName, woreda } = (req.body || {}) as CreateTicketRequest;
  const svc = SERVICES.includes(service as ServiceType) ? (service as ServiceType) : "S1";
  if (isDbEnabled) {
    const t = await createTicketDb(svc, notes, ownerName, woreda);
    sendSSE({ type: "ticket.created", payload: t });
    const rows = await displayRowsDb();
    sendSSE({ type: "display.updated", payload: rows });
    return res.status(201).json(t);
  }
  const ticket = enqueue(svc, notes, ownerName, woreda);
  res.status(201).json(ticket);
};

export const listWindows: RequestHandler = async (_req, res) => {
  if (isDbEnabled) return res.json(await listWindowsDb());
  res.json(windows);
};

export const callNext: RequestHandler = async (req, res) => {
  const windowId = Number(req.params.id);
  const { service = "S1" } = (req.body || {}) as CallNextRequest;

  if (isDbEnabled) {
    const result = await callNextDb(windowId, service as ServiceType);
    if (!result.ticket) return res.status(200).json({ message: "No tickets waiting" });
    sendSSE({ type: "window.updated", payload: result.window });
    sendSSE({ type: "ticket.updated", payload: result.ticket });
    const rows = await displayRowsDb();
    sendSSE({ type: "display.updated", payload: rows });
    return res.json({ window: result.window, ticket: result.ticket, display: rows });
  }

  const win = windows.find((w) => w.id === windowId);
  if (!win) return res.status(404).json({ error: "Window not found" });

  const next = pickNext(service as ServiceType);
  if (!next) return res.status(200).json({ message: "No tickets waiting" });

  next.status = "serving";
  next.windowId = win.id;
  win.currentTicketId = next.id;
  win.busy = true;
  win.updatedAt = Date.now();

  sendSSE({ type: "window.updated", payload: win });
  sendSSE({ type: "ticket.updated", payload: next });
  const rows = updateDisplay();
  res.json({ window: win, ticket: next, display: rows });
};

export const recall: RequestHandler = async (req, res) => {
  const windowId = Number(req.params.id);
  if (isDbEnabled) {
    const { ticket } = await recallDb(windowId);
    if (!ticket) return res.status(400).json({ error: "No active ticket" });
    const rows = await displayRowsDb();
    sendSSE({ type: "display.updated", payload: rows });
    return res.json({ ok: true, ticket, display: rows });
  }
  const win = windows.find((w) => w.id === windowId);
  if (!win) return res.status(404).json({ error: "Window not found" });
  const t = win.currentTicketId ? tickets[win.currentTicketId] : null;
  if (!t) return res.status(400).json({ error: "No active ticket" });
  // Emit display update (same state, just re-announce)
  const rows = updateDisplay();
  res.json({ ok: true, ticket: t, display: rows });
};

export const complete: RequestHandler = async (req, res) => {
  const windowId = Number(req.params.id);
  if (isDbEnabled) {
    try {
      const { window, ticket } = await completeDb(windowId);
      sendSSE({ type: "window.updated", payload: window });
      sendSSE({ type: "ticket.updated", payload: ticket });
      const rows = await displayRowsDb();
      sendSSE({ type: "display.updated", payload: rows });
      return res.json({ ok: true, ticket, window, display: rows });
    } catch (e: any) {
      return res.status(400).json({ error: e.message || String(e) });
    }
  }
  const win = windows.find((w) => w.id === windowId);
  if (!win) return res.status(404).json({ error: "Window not found" });
  const t = win.currentTicketId ? tickets[win.currentTicketId] : null;
  if (!t) return res.status(400).json({ error: "No active ticket" });

  t.status = "done";
  t.windowId = win.id;
  win.currentTicketId = null;
  win.busy = false;
  win.updatedAt = Date.now();

  sendSSE({ type: "window.updated", payload: win });
  sendSSE({ type: "ticket.updated", payload: t });
  const rows = updateDisplay();
  res.json({ ok: true, ticket: t, window: win, display: rows });
};

export const skip: RequestHandler = async (req, res) => {
  const windowId = Number(req.params.id);
  if (isDbEnabled) {
    try {
      const { window, ticket } = await skipDb(windowId);
      sendSSE({ type: "window.updated", payload: window });
      sendSSE({ type: "ticket.updated", payload: ticket });
      const rows = await displayRowsDb();
      sendSSE({ type: "display.updated", payload: rows });
      return res.json({ ok: true, ticket, window, display: rows });
    } catch (e: any) {
      return res.status(400).json({ error: e.message || String(e) });
    }
  }
  const win = windows.find((w) => w.id === windowId);
  if (!win) return res.status(404).json({ error: "Window not found" });
  const t = win.currentTicketId ? tickets[win.currentTicketId] : null;
  if (!t) return res.status(400).json({ error: "No active ticket" });

  t.status = "skipped";
  win.currentTicketId = null;
  win.busy = false;
  win.updatedAt = Date.now();

  sendSSE({ type: "window.updated", payload: win });
  sendSSE({ type: "ticket.updated", payload: t });
  const rows = updateDisplay();
  res.json({ ok: true, ticket: t, window: win, display: rows });
};

export const transfer: RequestHandler = async (req, res) => {
  const windowId = Number(req.params.id);
  const { targetWindowId } = (req.body || {}) as TransferRequest;
  if (isDbEnabled) {
    try {
      const { source, target, ticket } = await transferDb(windowId, Number(targetWindowId));
      sendSSE({ type: "window.updated", payload: source });
      sendSSE({ type: "window.updated", payload: target });
      sendSSE({ type: "ticket.updated", payload: ticket });
      const rows = await displayRowsDb();
      sendSSE({ type: "display.updated", payload: rows });
      return res.json({ ok: true, ticket, source, target, display: rows });
    } catch (e: any) {
      return res.status(400).json({ error: e.message || String(e) });
    }
  }
  const source = windows.find((w) => w.id === windowId);
  const target = windows.find((w) => w.id === Number(targetWindowId));
  if (!source || !target)
    return res.status(404).json({ error: "Source or target window not found" });

  const t = source.currentTicketId ? tickets[source.currentTicketId] : null;
  if (!t) return res.status(400).json({ error: "No active ticket to transfer" });

  source.currentTicketId = null;
  source.busy = false;
  source.updatedAt = Date.now();

  target.currentTicketId = t.id;
  target.busy = true;
  target.updatedAt = Date.now();

  t.status = "transferred";
  t.windowId = target.id;

  sendSSE({ type: "window.updated", payload: source });
  sendSSE({ type: "window.updated", payload: target });
  sendSSE({ type: "ticket.updated", payload: t });
  const rows = updateDisplay();
  res.json({ ok: true, ticket: t, source, target, display: rows });
};

export const displayData: RequestHandler = async (_req, res) => {
  if (isDbEnabled) {
    const rows = await displayRowsDb();
    const response: DisplayResponse = { rows };
    return res.json(response);
  }
  const rows = updateDisplay();
  const response: DisplayResponse = { rows };
  res.json(response);
};

// Demo seeding for quicker preview
export const seedDemo: RequestHandler = async (_req, res) => {
  if (isDbEnabled) {
    await seedDemoDb();
    const rows = await displayRowsDb();
    sendSSE({ type: "display.updated", payload: rows });
    return res.json({ ok: true });
  }
  for (let i = 0; i < 5; i++) enqueue("S1");
  for (let i = 0; i < 5; i++) enqueue("S2");
  for (let i = 0; i < 5; i++) enqueue("S3");
  res.json({ ok: true });
};
