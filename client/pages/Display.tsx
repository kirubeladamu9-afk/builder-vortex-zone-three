import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useSSE } from "@/hooks/use-sse";
import type { DisplayResponse, DisplayRow, WindowState } from "@shared/api";

async function getWindows(): Promise<WindowState[]> {
  const res = await fetch("/api/windows");
  if (!res.ok) throw new Error("Failed to fetch windows");
  return res.json();
}

async function getDisplay(): Promise<DisplayResponse> {
  const res = await fetch("/api/display");
  if (!res.ok) throw new Error("Failed to fetch display");
  return res.json();
}

export default function Display() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [winCodes, setWinCodes] = useState<Record<number, string | null>>({});

  useEffect(() => {
    let stop = false;
    getWindows().then((w) => !stop && setWindows(w)).catch(() => {});
    const poll = () =>
      getDisplay()
        .then((d) => {
          if (stop) return;
          const map: Record<number, string | null> = {};
          d.rows.forEach((r) => {
            if (r.nowServing.windowId) map[r.nowServing.windowId] = r.nowServing.code;
          });
          setWinCodes(map);
        })
        .catch(() => {});
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  useSSE("/api/events", (ev) => {
    if (ev.type === "init") {
      setWindows(ev.payload.windows as WindowState[]);
      const rows = ev.payload.display as DisplayRow[] | undefined;
      if (rows) {
        const map: Record<number, string | null> = {};
        rows.forEach((r) => {
          if (r.nowServing.windowId) map[r.nowServing.windowId] = r.nowServing.code;
        });
        setWinCodes(map);
      }
    }
    if (ev.type === "window.updated") {
      const w = ev.payload as WindowState;
      setWindows((prev) => prev.map((x) => (x.id === w.id ? w : x)));
    }
    if (ev.type === "display.updated") {
      const rows = ev.payload as DisplayRow[];
      const map: Record<number, string | null> = {};
      rows.forEach((r) => {
        if (r.nowServing.windowId) map[r.nowServing.windowId] = r.nowServing.code;
      });
      setWinCodes(map);
    }
  });

  return (
    <div className="min-h-[calc(100vh-120px)] bg-background py-10">
      <div className="container">
        <h1 className="mb-8 text-center font-display text-5xl font-bold">Now Serving</h1>
        <div className="grid gap-6 md:grid-cols-3">
          {windows.map((w) => {
            const code = winCodes[w.id] ?? null;
            return (
              <Card key={w.id} className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl">
                <div className="text-sm uppercase text-muted-foreground">{w.name}</div>
                <div className="mt-3 text-2xl font-semibold text-green-600">Now Serving: {code ?? "—"}</div>
                <div className="mt-2 text-sm text-muted-foreground">Status: {w.busy ? "Serving" : "Idle"}</div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
