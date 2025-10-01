import {
  Award,
  BadgeCheck,
  ClipboardSignature,
  FileText,
  Handshake,
  ShieldCheck,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SERVICE_TYPES = [
  "Social Security Renewal",
  "Benefits Enrollment",
  "Document Authentication",
  "Priority Support",
];

const RECEPTION_GAINS = [
  {
    icon: BadgeCheck,
    title: "Eligibility checkpoint",
    description:
      "Quick guidance prompts reception to confirm the right paperwork before generating the QR ticket.",
  },
  {
    icon: ShieldCheck,
    title: "No personal data stored",
    description:
      "Tickets are tied to QR IDs, not phone numbers. Privacy policies stay intact across every interaction.",
  },
  {
    icon: Handshake,
    title: "Seamless hand-offs",
    description:
      "Window staff receive context automatically, including service type, notes, and priority markers.",
  },
];

const SCRIPT_POINTS = [
  "Welcome and verify service eligibility",
  "Capture service selection & add context",
  "Generate QR ticket and confirm lounge instructions",
];

export default function Reception() {
  return (
    <div className="relative overflow-hidden">
      <section className="container grid gap-12 py-16 lg:grid-cols-[1.05fr,0.95fr] lg:items-start">
        <div className="space-y-6">
          <Badge className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-primary">
            Phase 1 · Reception Console
          </Badge>
          <h1 className="font-display text-4xl font-semibold text-foreground md:text-5xl">
            Issue QR-powered tickets while giving staff guided confidence
          </h1>
          <p className="text-lg text-muted-foreground">
            Replace scribbled paper with a structured console built for speed.
            Every ticket is generated with a single tap, instantly queued, and
            ready for the guest to scan.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
              <p className="text-xs uppercase text-muted-foreground">
                Average issuance time
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                42 sec
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                From arrival to QR slip
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
              <p className="text-xs uppercase text-muted-foreground">
                Priority handling
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                Auto alerts
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Accessibility & VIP ready
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
              <p className="text-xs uppercase text-muted-foreground">
                Training time
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                <span className="text-primary">1 shift</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Guided onboarding module
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-lg shadow-primary/10">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Reception script at a glance
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Empower new hires with a consistent approach. Prompts evolve as
              fields are completed to keep conversations smooth.
            </p>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              {SCRIPT_POINTS.map((step, index) => (
                <li
                  key={step}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-foreground">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Card className="border-border/60 bg-card/80 p-6 shadow-xl shadow-primary/10">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ClipboardSignature className="h-6 w-6 text-primary" />
              Issue virtual ticket
            </CardTitle>
            <CardDescription>
              Capture the essentials, click “Generate QR Ticket”, and hand the
              guest a slip—or mirror the QR on screen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customer-name">Customer name</Label>
                <Input
                  id="customer-name"
                  placeholder="Add guest or organization name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="service-type">Service type</Label>
                <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/70 p-3">
                  {SERVICE_TYPES.map((service) => (
                    <button
                      key={service}
                      type="button"
                      className="flex items-center justify-between rounded-xl border border-transparent bg-card px-3 py-2 text-left text-sm font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                    >
                      {service}
                      <Award className="h-4 w-4 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Context for window team</Label>
                <Textarea
                  id="notes"
                  placeholder="List required documents, accommodations, or quick notes for window staff."
                  className="min-h-[120px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority-code">Priority code</Label>
                <Input
                  id="priority-code"
                  placeholder="Optional – e.g. Accessibility, VIP, Language support"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-primary">
              <p className="font-semibold uppercase tracking-wide">
                Ticket preview
              </p>
              <div className="mt-3 grid gap-2 text-primary/80">
                <p>
                  <span className="font-semibold text-primary">Ticket:</span>{" "}
                  S1-015
                </p>
                <p>
                  <span className="font-semibold text-primary">
                    Queue position:
                  </span>{" "}
                  4th in line
                </p>
                <p>
                  <span className="font-semibold text-primary">
                    Tracking URL:
                  </span>{" "}
                  qflowhq.com/tickets/S1-015
                </p>
              </div>
            </div>
            <Button className="w-full h-12 text-base shadow-lg shadow-primary/20">
              Generate QR Ticket
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              QR auto-refreshes every 60 seconds. Print or display to the guest
              instantly.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="border-t border-border/60 bg-foreground/5 py-16">
        <div className="container grid gap-8 lg:grid-cols-3">
          {RECEPTION_GAINS.map((item) => (
            <Card
              key={item.title}
              className="border-border/60 bg-card/80 p-6 shadow-md shadow-primary/5"
            >
              <CardHeader className="space-y-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
