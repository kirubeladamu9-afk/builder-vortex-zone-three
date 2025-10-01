import { useEffect, useState } from "react";
import { useSSE } from "@/hooks/use-sse";
import type { DisplayResponse, DisplayRow } from "@shared/api";

async function getDisplay(): Promise<DisplayResponse> {
  const res = await fetch("/api/display");
  if (!res.ok) throw new Error("Failed to fetch display");
  return res.json();
}

export default function Display() {
  const [rows, setRows] = useState<DisplayRow[]>([]);

  useEffect(() => {
    getDisplay().then((d) => setRows(d.rows));
  }, []);

  useSSE("/api/events", (ev) => {
    if (ev.type === "display.updated") setRows(ev.payload as DisplayRow[]);
  });

  return (
    <div className="min-h-[calc(100vh-120px)] bg-background py-10">
      <div className="container">
        <h1 className="mb-8 text-center font-display text-5xl font-bold">
          Now Serving
        </h1>
        <div className="grid gap-6 md:grid-cols-3">
          {rows.map((r) => (
            <div
              key={r.service}
              className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-xl"
            >
              <div className="text-sm uppercase text-muted-foreground">
                Service {r.service.slice(1)}
              </div>
              <div className="mt-3 text-2xl font-semibold text-green-600">
                Now Serving: {r.nowServing.code ?? "—"}
                {r.nowServing.code && (
                  <span className="ml-2 text-base text-foreground">
                    at Window {r.nowServing.windowId}
                  </span>
                )}
              </div>
              <div className="mt-2 text-lg text-muted-foreground">
                Next: {r.next ?? "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
