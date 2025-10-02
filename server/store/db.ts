import { Pool } from "pg";
import type {
  DisplayRow,
  ServiceType,
  Ticket,
  WindowState,
} from "../../shared/api";
import { formatTicketCode } from "../../shared/api";

export const isDbEnabled = Boolean(process.env.DATABASE_URL);

let pool: Pool | null = null;

export function getPool() {
  if (!isDbEnabled) throw new Error("DB not enabled");
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function initDb() {
  if (!isDbEnabled) return;
  const p = getPool();
  try {
    await p.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
  } catch {
    // ignore if not permitted; we'll generate UUIDs in app code
  }
  await p.query(`CREATE TABLE IF NOT EXISTS windows (
    id int primary key,
    name text not null,
    current_ticket_id uuid,
    busy boolean not null default false,
    updated_at timestamptz not null default now()
  );`);
  await p.query(`CREATE TABLE IF NOT EXISTS tickets (
    id uuid primary key,
    service text not null,
    number int not null,
    code text not null unique,
    status text not null,
    window_id int,
    created_at timestamptz not null default now(),
    started_at timestamptz,
    completed_at timestamptz,
    notes text,
    owner_name text,
    woreda text
  );`);
  // Backfill columns if table existed
  await p.query(
    `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS owner_name text;`,
  );
  await p.query(`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS woreda text;`);
  await p.query(`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS started_at timestamptz;`);
  await p.query(`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS completed_at timestamptz;`);
  await p.query(`CREATE TABLE IF NOT EXISTS service_counters (
    service text primary key,
    next_number int not null
  );`);
  // seed windows 1..6
  for (let i = 1; i <= 6; i++) {
    await p.query(
      `INSERT INTO windows (id, name, busy) VALUES ($1, $2, false)
       ON CONFLICT (id) DO NOTHING;`,
      [i, `Window ${i}`],
    );
  }
  const services: ServiceType[] = ["S1", "S2", "S3"];
  for (const s of services) {
    await p.query(
      `INSERT INTO service_counters (service, next_number) VALUES ($1, 1)
       ON CONFLICT (service) DO NOTHING;`,
      [s],
    );
  }
}

export async function listWindowsDb(): Promise<WindowState[]> {
  const { rows } = await getPool().query(
    "SELECT id, name, current_ticket_id, busy, extract(epoch from updated_at)*1000 as updated_at FROM windows ORDER BY id",
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    currentTicketId: r.current_ticket_id,
    busy: r.busy,
    updatedAt: Math.round(Number(r.updated_at)),
  }));
}

async function nextNumber(
  service: ServiceType,
  client: Pool["connect"] extends (...args: any) => infer R ? R : any,
) {
  const res = await client.query(
    `UPDATE service_counters SET next_number = next_number + 1 WHERE service=$1 RETURNING next_number;`,
    [service],
  );
  const next = res.rows[0].next_number as number;
  return next - 1;
}

export async function createTicketDb(
  service: ServiceType,
  notes?: string,
  ownerName?: string,
  woreda?: string,
): Promise<Ticket> {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const number = await nextNumber(service, client);
    const code = formatTicketCode(service, number);
    const id = (await import("node:crypto")).randomUUID();
    const { rows } = await client.query(
      `INSERT INTO tickets (id, service, number, code, status, window_id, notes, owner_name, woreda)
       VALUES ($1, $2, $3, $4, 'waiting', NULL, $5, $6, $7)
       RETURNING id, service, number, code, status, window_id, extract(epoch from created_at)*1000 as created_at, notes, owner_name, woreda;`,
      [
        id,
        service,
        number,
        code,
        notes ?? null,
        ownerName ?? null,
        woreda ?? null,
      ],
    );
    await client.query("COMMIT");
    const r = rows[0];
    return {
      id: r.id,
      service: r.service,
      number: r.number,
      code: r.code,
      status: r.status,
      windowId: r.window_id,
      createdAt: Math.round(Number(r.created_at)),
      notes: r.notes ?? undefined,
      ownerName: r.owner_name ?? undefined,
      woreda: r.woreda ?? undefined,
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function callNextDb(windowId: number, service: ServiceType) {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const nextRes = await client.query(
      `SELECT id FROM tickets WHERE service=$1 AND status='waiting' ORDER BY created_at, number LIMIT 1 FOR UPDATE SKIP LOCKED;`,
      [service],
    );
    if (!nextRes.rowCount) {
      await client.query("COMMIT");
      return { window: await getWindow(client, windowId), ticket: null as any };
    }
    const ticketId = nextRes.rows[0].id;
    const tRes = await client.query(
      `UPDATE tickets SET status='serving', window_id=$1, started_at=COALESCE(started_at, now()) WHERE id=$2 RETURNING id, service, number, code, status, window_id, extract(epoch from created_at)*1000 as created_at, notes, owner_name, woreda;`,
      [windowId, ticketId],
    );
    await client.query(
      `UPDATE windows SET current_ticket_id=$1, busy=true, updated_at=now() WHERE id=$2`,
      [ticketId, windowId],
    );
    await client.query("COMMIT");
    const ticket = rowToTicket(tRes.rows[0]);
    const window = await getWindow(p, windowId);
    return { window, ticket };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function recallDb(windowId: number) {
  const p = getPool();
  const { rows } = await p.query(
    `SELECT t.* , extract(epoch from t.created_at)*1000 as created_at_ms
    FROM windows w LEFT JOIN tickets t ON t.id = w.current_ticket_id WHERE w.id=$1`,
    [windowId],
  );
  const r = rows[0];
  return {
    ticket: r ? rowToTicket({ ...r, created_at: r.created_at_ms }) : null,
  };
}

export async function completeDb(windowId: number) {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const w = await getWindow(client, windowId);
    if (!w.currentTicketId) throw new Error("No active ticket");
    const tRes = await client.query(
      `UPDATE tickets SET status='done', completed_at=now() WHERE id=$1 RETURNING id, service, number, code, status, window_id, extract(epoch from created_at)*1000 as created_at, notes, owner_name, woreda;`,
      [w.currentTicketId],
    );
    await client.query(
      `UPDATE windows SET current_ticket_id=NULL, busy=false, updated_at=now() WHERE id=$1`,
      [windowId],
    );
    await client.query("COMMIT");
    return {
      window: await getWindow(p, windowId),
      ticket: rowToTicket(tRes.rows[0]),
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function skipDb(windowId: number) {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const w = await getWindow(client, windowId);
    if (!w.currentTicketId) throw new Error("No active ticket");
    const tRes = await client.query(
      `UPDATE tickets SET status='skipped' WHERE id=$1 RETURNING id, service, number, code, status, window_id, extract(epoch from created_at)*1000 as created_at, notes, owner_name, woreda;`,
      [w.currentTicketId],
    );
    await client.query(
      `UPDATE windows SET current_ticket_id=NULL, busy=false, updated_at=now() WHERE id=$1`,
      [windowId],
    );
    await client.query("COMMIT");
    return {
      window: await getWindow(p, windowId),
      ticket: rowToTicket(tRes.rows[0]),
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function transferDb(windowId: number, targetWindowId: number) {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const source = await getWindow(client, windowId);
    const target = await getWindow(client, targetWindowId);
    if (!source.currentTicketId) throw new Error("No active ticket");

    await client.query(
      `UPDATE windows SET current_ticket_id=NULL, busy=false, updated_at=now() WHERE id=$1`,
      [windowId],
    );
    await client.query(
      `UPDATE windows SET current_ticket_id=$1, busy=true, updated_at=now() WHERE id=$2`,
      [source.currentTicketId, targetWindowId],
    );
    const tRes = await client.query(
      `UPDATE tickets SET status='transferred', window_id=$1 WHERE id=$2 RETURNING id, service, number, code, status, window_id, extract(epoch from created_at)*1000 as created_at, notes, owner_name, woreda;`,
      [targetWindowId, source.currentTicketId],
    );
    await client.query("COMMIT");

    return {
      source: await getWindow(p, windowId),
      target: await getWindow(p, targetWindowId),
      ticket: rowToTicket(tRes.rows[0]),
    };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function displayRowsDb(): Promise<DisplayRow[]> {
  const p = getPool();
  const services: ServiceType[] = ["S1", "S2", "S3"];
  const rows: DisplayRow[] = [];
  for (const s of services) {
    const nowRes = await p.query(
      `SELECT t.code, w.id as window_id FROM windows w
       LEFT JOIN tickets t ON t.id = w.current_ticket_id
       WHERE t.service=$1 AND t.status IN ('serving','transferred')
       ORDER BY w.updated_at DESC LIMIT 1`,
      [s],
    );
    const nextRes = await p.query(
      `SELECT code FROM tickets WHERE service=$1 AND status='waiting' ORDER BY created_at, number LIMIT 1`,
      [s],
    );
    rows.push({
      service: s,
      nowServing: nowRes.rowCount
        ? { code: nowRes.rows[0].code, windowId: nowRes.rows[0].window_id }
        : { code: null, windowId: null },
      next: nextRes.rowCount ? nextRes.rows[0].code : null,
    });
  }
  return rows;
}

export async function seedDemoDb() {
  for (let i = 0; i < 5; i++) await createTicketDb("S1");
  for (let i = 0; i < 5; i++) await createTicketDb("S2");
  for (let i = 0; i < 5; i++) await createTicketDb("S3");
}

export async function getTicketByCodeDb(code: string): Promise<{
  ticket: Ticket | null;
  positionInQueue: number | null;
  estimatedWaitSeconds: number | null;
}> {
  const p = getPool();
  const tRes = await p.query(
    `SELECT id, service, number, code, status, window_id, extract(epoch from created_at)*1000 as created_at, notes, owner_name, woreda
     FROM tickets WHERE code=$1 LIMIT 1`,
    [code],
  );
  if (!tRes.rowCount) return { ticket: null, positionInQueue: null, estimatedWaitSeconds: null };
  const t = rowToTicket(tRes.rows[0]);
  if (t.status !== "waiting") return { ticket: t, positionInQueue: null, estimatedWaitSeconds: null };
  const posRes = await p.query(
    `SELECT COUNT(*) AS ahead FROM tickets
     WHERE service=$1 AND status='waiting' AND (created_at < (SELECT created_at FROM tickets WHERE id=$2) OR (created_at = (SELECT created_at FROM tickets WHERE id=$2) AND number < (SELECT number FROM tickets WHERE id=$2)))`,
    [t.service, t.id],
  );
  const ahead = Number(posRes.rows[0].ahead || 0);
  const position = ahead + 1;
  const avgRes = await p.query(
    `SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) AS avg_seconds
     FROM tickets WHERE service=$1 AND completed_at IS NOT NULL AND started_at IS NOT NULL`,
    [t.service],
  );
  const avg = Math.max(60, Math.round(Number(avgRes.rows[0]?.avg_seconds || 300)));
  return { ticket: t, positionInQueue: position, estimatedWaitSeconds: position * avg };
}

function rowToTicket(r: any): Ticket {
  return {
    id: r.id,
    service: r.service,
    number: r.number,
    code: r.code,
    status: r.status,
    windowId: r.window_id,
    createdAt: Math.round(Number(r.created_at)),
    notes: r.notes ?? undefined,
    ownerName: r.owner_name ?? undefined,
    woreda: r.woreda ?? undefined,
  };
}

async function getWindow(clientOrPool: any, id: number): Promise<WindowState> {
  const { rows } = await clientOrPool.query(
    `SELECT id, name, current_ticket_id, busy, extract(epoch from updated_at)*1000 as updated_at FROM windows WHERE id=$1`,
    [id],
  );
  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    currentTicketId: r.current_ticket_id,
    busy: r.busy,
    updatedAt: Math.round(Number(r.updated_at)),
  };
}

// initialize on import
initDb().catch((e) => console.error("DB init failed", e));
