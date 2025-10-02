import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSSE } from "@/hooks/use-sse";
import type { Ticket, WindowState } from "@shared/api";
import { toast } from "sonner";
import { apiFetch, apiUrl } from "@/lib/api";


function speak(text: string) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find((v) => /en[-_]/i.test(v.lang));
    if (en) u.voice = en;
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {}
}

export default function Teller() {
  const qc = useQueryClient();

  const windowsQuery = useQuery({
    queryKey: ["windows"],
    queryFn: async () => apiFetch<WindowState[]>("/api/windows"),
    refetchOnWindowFocus: false,
    refetchInterval: 3000,
  });

  const [tickets, setTickets] = useState<Record<string, Ticket>>({});

  useSSE(apiUrl("/api/events"), (ev) => {
    if (ev.type === "init") {
      setTickets(ev.payload.tickets);
      qc.setQueryData(["windows"], ev.payload.windows as WindowState[]);
    }
    if (ev.type === "window.updated") {
      qc.setQueryData<WindowState[]>(["windows"], (prev) => {
        if (!prev) return prev;
        return prev.map((w) => (w.id === ev.payload.id ? ev.payload : w));
      });
    }
    if (ev.type === "ticket.created" || ev.type === "ticket.updated") {
      const t = ev.payload as Ticket;
      setTickets((m) => ({ ...m, [t.id]: t }));
    }
  });

  const callNext = useMutation({
    mutationFn: async (p: { id: number }) =>
      apiFetch<{ window: WindowState; ticket: Ticket }>(`/api/windows/${p.id}/call-next`, {
        method: "POST",
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["windows"] });
      if (data?.ticket && data?.window) {
        speak(`Ticket ${data.ticket.code}, please proceed to ${data.window.name}`);
      }
    },
  });

  const recall = useMutation({
    mutationFn: async (p: { id: number; reason?: string }) =>
      apiFetch<{ ticket: Ticket }>(`/api/windows/${p.id}/recall`, {
        method: "POST",
        body: JSON.stringify({ reason: p.reason }),
      }),
    onSuccess: (data, vars) => {
      const win = qc.getQueryData<WindowState[]>(["windows"])?.find((w) => w.id === vars.id);
      if (data?.ticket && win) speak(`Ticket ${data.ticket.code}, please proceed to ${win.name}`);
      toast.message("Recalled current ticket");
    },
  });
  const complete = useMutation({
    mutationFn: async (id: number) =>
      apiFetch(`/api/windows/${id}/complete`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["windows"] }),
  });
  const skip = useMutation({
    mutationFn: async (p: { id: number; reason?: string }) =>
      apiFetch(`/api/windows/${p.id}/skip`, {
        method: "POST",
        body: JSON.stringify({ reason: p.reason }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["windows"] }),
  });
  const transfer = useMutation({
    mutationFn: async (p: { id: number; target: number }) =>
      apiFetch(`/api/windows/${p.id}/transfer`, {
        method: "POST",
        body: JSON.stringify({ targetWindowId: p.target }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["windows"] }),
  });

  // FIFO mode active: no per-window service selection

  return (
    <div className="container py-10">
      <h1 className="mb-6 font-display text-3xl font-semibold">
        Teller Console
      </h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {windowsQuery.data?.map((w) => (
          <Card key={w.id} className="border-border/70 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{w.name}</span>
                <span
                  className={`text-sm ${w.busy ? "text-green-600" : "text-muted-foreground"}`}
                >
                  {w.busy ? "Serving" : "Idle"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  Current ticket
                </p>
                <p className="mt-1 font-display text-2xl">
                  {w.currentTicketId
                    ? (tickets[w.currentTicketId]?.code ?? "")
                    : "—"}
                </p>
                {w.currentTicketId && (
                  <div className="mt-3 grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Owner</span>
                      <span className="font-medium">
                        {tickets[w.currentTicketId]?.ownerName ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Woreda</span>
                      <span className="font-medium">
                        {tickets[w.currentTicketId]?.woreda ?? "—"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">
                        Notes
                      </p>
                      <p className="whitespace-pre-wrap">
                        {tickets[w.currentTicketId]?.notes || "—"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() =>
                    callNext.mutate({ id: w.id })
                  }
                  disabled={callNext.isPending}
                >
                  Call Next
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => recall.mutate({ id: w.id })}
                  disabled={recall.isPending || !w.currentTicketId}
                >
                  Recall
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => complete.mutate(w.id)}
                  disabled={complete.isPending}
                >
                  Done
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const reason = window.prompt("Reason for skipping? (optional)") || undefined;
                    skip.mutate({ id: w.id, reason });
                  }}
                  disabled={skip.isPending}
                >
                  Skip
                </Button>
                <TransferControl
                  windowId={w.id}
                  onTransfer={(target) => transfer.mutate({ id: w.id, target })}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6">
        <Button
          variant="outline"
          onClick={async () => {
            await apiFetch("/api/seed", { method: "POST" });
            toast.success("Seeded sample tickets");
          }}
        >
          Seed demo tickets
        </Button>
      </div>
    </div>
  );
}

function TransferControl({
  windowId,
  onTransfer,
}: {
  windowId: number;
  onTransfer: (target: number) => void;
}) {
  const { data } = useQuery({
    queryKey: ["windows"],
    queryFn: async () => apiFetch<WindowState[]>("/api/windows"),
  });
  const targets = useMemo(
    () => (data || []).filter((w) => w.id !== windowId),
    [data, windowId],
  );
  const [target, setTarget] = useState<number | undefined>(targets[0]?.id);
  useEffect(() => setTarget(targets[0]?.id), [targets]);

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-10 rounded-md border border-border bg-background px-2 text-sm"
        value={target}
        onChange={(e) => setTarget(Number(e.target.value))}
      >
        {targets.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <Button variant="ghost" onClick={() => target && onTransfer(target)}>
        Transfer
      </Button>
    </div>
  );
}
