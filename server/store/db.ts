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
    notes text,
    owner_name text,
    woreda text
  );`);
  // Backfill columns if table existed
  await p.query(
    `ALTER TABLE tickets ADD COLUMN IF NOT EXISTS owner_name text;`,
  );
  await p.query(`ALTER TABLE tickets ADD COLUMN IF NOT EXISTS woreda text;`);
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
    const { rows } = await client.query(
      `INSERT INTO tickets (id, service, number, code, status, window_id, notes, owner_name, woreda)
       VALUES (gen_random_uuid(), $1, $2, $3, 'waiting', NULL, $4, $5, $6)
       RETURNING id, service, number, code, status, window_id, extract(epoch from created_at)*1000 as created_at, notes, owner_name, woreda;`,
      [service, number, code, notes ?? null, ownerName ?? null, woreda ?? null],
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
      `UPDATE tickets SET status='serving', window_id=$1 WHERE id=$2 RETURNING id, service, number, code, status, window_id, extract(epoch from created_at)*1000 as created_at, notes;`,
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
      `UPDATE tickets SET status='done' WHERE id=$1 RETURNING id, service, number, code, status, window_id, extract(epoch from created_at)*1000 as created_at, notes;`,
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
      `UPDATE tickets SET status='skipped' WHERE id=$1 RETURNING id, service, number, code, status, window_id, extract(epoch from created_at)*1000 as created_at, notes;`,
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
      `UPDATE tickets SET status='transferred', window_id=$1 WHERE id=$2 RETURNING id, service, number, code, status, window_id, extract(epoch from created_at)*1000 as created_at, notes;`,
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
