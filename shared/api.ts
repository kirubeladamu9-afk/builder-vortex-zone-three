/**
 * Shared types for Queue/Teller system
 */

export type ServiceType = "S1" | "S2" | "S3";

export interface Ticket {
  id: string; // uuid
  service: ServiceType;
  number: number; // incremental per service
  code: string; // e.g. S1-015
  status: "waiting" | "serving" | "done" | "skipped" | "transferred";
  windowId: number | null;
  createdAt: number;
  notes?: string;
  ownerName?: string;
  woreda?: string;
}

export interface WindowState {
  id: number; // 1..6
  name: string; // "Window 1" etc
  currentTicketId: string | null;
  busy: boolean;
  updatedAt: number;
}

export interface DisplayRow {
  service: ServiceType;
  nowServing: { code: string | null; windowId: number | null };
  next: string | null;
}

export interface QueueSnapshot {
  windows: WindowState[];
  services: Record<ServiceType, { nextNumber: number; waitingIds: string[] }>;
  tickets: Record<string, Ticket>;
}

export type QueueEvent =
  | { type: "init"; payload: QueueSnapshot }
  | { type: "window.updated"; payload: WindowState }
  | { type: "ticket.created"; payload: Ticket }
  | { type: "ticket.updated"; payload: Ticket }
  | { type: "display.updated"; payload: DisplayRow[] };

export interface CallNextRequest {
  service?: ServiceType; // defaults to S1
}

export interface TransferRequest {
  targetWindowId: number;
}

export interface CreateTicketRequest {
  service: ServiceType;
  notes?: string;
  ownerName?: string;
  woreda?: string;
}

export interface DisplayResponse {
  rows: DisplayRow[];
}

export interface TicketStatusResponse {
  ticket: Ticket | null;
  positionInQueue: number | null; // 1-based position if waiting, else null
  estimatedWaitSeconds: number | null; // null if not applicable or unknown
}

export function formatTicketCode(service: ServiceType, number: number) {
  return `${service}-${String(number).padStart(3, "0")}`;
}
