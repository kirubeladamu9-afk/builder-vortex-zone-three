import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Clock4,
  Compass,
  QrCode,
  SignalHigh,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSSE } from "@/hooks/use-sse";
import type { DisplayResponse, DisplayRow } from "@shared/api";

const STATUS_STEPS = [
  {
    title: "Scan QR",
    description:
      "Guests unlock their live ticket from any device—no sign-in required.",
    icon: QrCode,
  },
  {
    title: "Track position",
    description:
      "Every refresh recalculates wait time using the latest throughput data.",
    icon: Clock4,
  },
  {
    title: "Get notified",
    description:
      "Highlighted alerts prompt guests when it’s time to move toward the window.",
    icon: BellRing,
  },
];

const QR_DISPLAY_MATRIX = [
  "1111011",
  "1000001",
  "1011101",
  "1010101",
  "1011101",
  "1000001",
  "1101111",
];

const QueueQRCode = () => (
  <div className="grid grid-cols-7 gap-1 rounded-2xl bg-white p-3 shadow-inner shadow-primary/10">
    {QR_DISPLAY_MATRIX.flatMap((row, rowIndex) =>
      row
        .split("")
        .map((cell, cellIndex) => (
          <span
            key={`${rowIndex}-${cellIndex}`}
            className={cn(
              "h-2 w-2 rounded-[2px] md:h-3 md:w-3",
              cell === "1" ? "bg-foreground" : "bg-muted",
            )}
          />
        )),
    )}
  </div>
);

async function getDisplay(): Promise<DisplayResponse> {
  const res = await fetch("/api/display");
  if (!res.ok) throw new Error("Failed to fetch display");
  return res.json();
}

export default function Queue() {
  const [rows, setRows] = useState<DisplayRow[]>([]);

  useEffect(() => {
    let stop = false;
    getDisplay()
      .then((d) => !stop && setRows(d.rows))
      .catch(() => {});
    const id = setInterval(() => {
      getDisplay()
        .then((d) => !stop && setRows(d.rows))
        .catch(() => {});
    }, 3000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  useSSE("/api/events", (ev) => {
    if (ev.type === "display.updated") setRows(ev.payload as DisplayRow[]);
  });

  return (
    <div className="relative overflow-hidden">
      <section className="container grid gap-12 py-16 lg:grid-cols-[1fr,0.9fr] lg:items-start">
        <div className="space-y-6">
          <Badge className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-primary">
            Phase 2 · Customer View
          </Badge>
          <h1 className="font-display text-4xl font-semibold text-foreground md:text-5xl">
            A personal status hub that keeps guests relaxed and ready
          </h1>
          <p className="text-lg text-muted-foreground">
            Each QR ticket leads to a responsive web experience with live queue
            position, estimated wait, and clear prompts. Guests stay informed
            without lingering near the counter.
          </p>
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-lg shadow-primary/10">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              How the QR status page guides every step
            </h2>
            <ul className="mt-6 space-y-4">
              {STATUS_STEPS.map((step) => (
                <li
                  key={step.title}
                  className="flex items-start gap-4 rounded-2xl border border-border/60 bg-background/70 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {step.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 -z-10 rounded-[36px] bg-gradient-to-br from-primary/20 via-sky-400/10 to-indigo-500/10 blur-2xl" />
          <Card className="mx-auto max-w-sm border-border/60 bg-card/90 p-6 shadow-2xl shadow-primary/20">
            <CardHeader className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <SignalHigh className="h-4 w-4" />{" "}
                {rows.length ? "Live queue synced" : "Waiting for updates"}
              </div>
              <CardTitle className="text-2xl">Live Queue</CardTitle>
              <CardDescription>
                Now Serving and On Deck by service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.map((r) => (
                <div
                  key={r.service}
                  className="rounded-2xl border border-border/60 bg-background/70 p-4"
                >
                  <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                    Service {r.service.slice(1)}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-card/80 p-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        On deck
                      </p>
                      <p className="mt-1 font-display text-2xl font-semibold text-foreground">
                        {r.next ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Please head to the waiting area
                      </p>
                    </div>
                    <div className="rounded-2xl bg-card/80 p-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Now serving
                      </p>
                      <p className="mt-1 font-display text-2xl font-semibold text-foreground">
                        {r.nowServing.code ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.nowServing.code
                          ? r.nowServing.windowId
                            ? `Window ${r.nowServing.windowId}`
                            : "Please be ready"
                          : "Stand by for your turn"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-primary">
                <div>
                  <p className="text-xs uppercase tracking-widest">Action</p>
                  <p className="font-semibold">
                    {rows.some((r) => r.nowServing.code)
                      ? "Please proceed when called"
                      : "Please proceed to waiting area"}
                  </p>
                </div>
                <Sparkles className="h-5 w-5" />
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                  <span>Scan anytime</span>
                  <span>Window updates every 30s</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <QueueQRCode />
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="text-sm font-semibold text-foreground">
                      Tracking URL
                    </p>
                    <p className="rounded-full bg-card px-3 py-1 font-medium text-primary">
                      qflowhq.com/tickets
                    </p>
                    <p>Save to wallet or share with companions.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="border-t border-border/60 bg-foreground/5 py-16">
        <div className="container grid gap-8 lg:grid-cols-3">
          {[
            "Displays mirror Now Serving",
            "Accessible fallback via concierge",
            "Multi-language prompts included",
          ].map((item) => (
            <Card
              key={item}
              className="border-border/60 bg-card/80 p-6 shadow-md shadow-primary/10"
            >
              <CardHeader className="space-y-3">
                <Compass className="h-6 w-6 text-primary" />
                <CardTitle className="text-lg">{item}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground">
                  Guests always have a clear path forward, whether via QR scans,
                  concierge support, or immersive lobby signage.
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <Button
            size="lg"
            className="h-12 px-6 text-base shadow-lg shadow-primary/20"
          >
            Download lobby signage kit
          </Button>
          <Button variant="outline" size="lg" className="h-12 px-6 text-base">
            Explore analytics dashboard
          </Button>
        </div>
      </section>
    </div>
  );
}
