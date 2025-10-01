import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useSSE } from "@/hooks/use-sse";
import type { Ticket, WindowState } from "@shared/api";

async function getWindows(): Promise<WindowState[]> {
  const res = await fetch("/api/windows");
  if (!res.ok) throw new Error("Failed to fetch windows");
  return res.json();
}

export default function Display() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [tickets, setTickets] = useState<Record<string, Ticket>>({});

  useEffect(() => {
    getWindows().then(setWindows).catch(() => {});
  }, []);

  useSSE("/api/events", (ev) => {
    if (ev.type === "init") {
      setWindows(ev.payload.windows as WindowState[]);
      setTickets(ev.payload.tickets as Record<string, Ticket>);
    }
    if (ev.type === "window.updated") {
      const w = ev.payload as WindowState;
      setWindows((prev) => prev.map((x) => (x.id === w.id ? w : x)));
    }
    if (ev.type === "ticket.created" || ev.type === "ticket.updated") {
      const t = ev.payload as Ticket;
      setTickets((m) => ({ ...m, [t.id]: t }));
    }
  });

  return (
    <div className="min-h-[calc(100vh-120px)] bg-background py-10">
      <div className="container">
        <h1 className="mb-8 text-center font-display text-5xl font-bold">
          Now Serving
        </h1>
        <div className="grid gap-6 md:grid-cols-3">
          {windows.map((w) => {
            const code = w.currentTicketId ? tickets[w.currentTicketId]?.code : null;
            return (
              <Card key={w.id} className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl">
                <div className="text-sm uppercase text-muted-foreground">
                  {w.name}
                </div>
                <div className="mt-3 text-2xl font-semibold text-green-600">
                  Now Serving: {code ?? "—"}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Status: {w.busy ? "Serving" : "Idle"}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
