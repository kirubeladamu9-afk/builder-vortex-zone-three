import { useEffect, useMemo, useState } from "react";
import { Loader2, Award, BadgeCheck, ClipboardSignature, Handshake, ShieldCheck } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import QRCode from "qrcode";
import { toast } from "sonner";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ServiceType, Ticket } from "@shared/api";

const SERVICE_OPTIONS: Array<{
  value: ServiceType;
  label: string;
  description: string;
}> = [
  {
    value: "S1",
    label: "Service 1",
    description: "Social security renewals and intake confirmations.",
  },
  {
    value: "S2",
    label: "Service 2",
    description: "Benefits enrollment and account updates.",
  },
  {
    value: "S3",
    label: "Service 3",
    description: "Document authentication and priority support.",
  },
];

const WOREDA_OPTIONS = [
  "Addis Ketema",
  "Akaki Kaliti",
  "Arada",
  "Bole",
  "Gullele",
  "Kirkos",
  "Kolfe Keranio",
  "Lideta",
  "Nifas Silk-Lafto",
  "Yeka",
] as const;

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

type CreateTicketPayload = {
  service: ServiceType;
  ownerName: string;
  woreda: string;
  notes?: string;
  priorityCode?: string;
};

async function createTicketRequest(payload: CreateTicketPayload): Promise<Ticket> {
  const trimmedNotes = payload.notes?.trim() ?? "";
  const trimmedPriority = payload.priorityCode?.trim() ?? "";
  const combinedNotes = [
    trimmedPriority ? `Priority: ${trimmedPriority}` : null,
    trimmedNotes ? trimmedNotes : null,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch("/api/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service: payload.service,
      ownerName: payload.ownerName,
      woreda: payload.woreda,
      notes: combinedNotes || undefined,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text);
      const message = parsed.error || parsed.message || text || "Unable to create ticket.";
      throw new Error(message);
    } catch (error) {
      if (error instanceof Error && error.message !== "Unexpected end of JSON input") {
        throw error;
      }
      throw new Error(text || "Unable to create ticket.");
    }
  }

  return (await response.json()) as Ticket;
}

type DraftDetails = {
  ownerName: string;
  woreda: string;
  notes: string;
  priorityCode: string;
  service: ServiceType;
};

type ServiceOption = (typeof SERVICE_OPTIONS)[number];

interface ServiceOptionCardProps {
  option: ServiceOption;
  isSelected: boolean;
  onSelect: (value: ServiceType) => void;
}

function ServiceOptionCard({ option, isSelected, onSelect }: ServiceOptionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card/80 p-4 text-left transition",
        isSelected
          ? "border-primary/60 shadow-sm shadow-primary/30"
          : "border-border/70 hover:border-primary/40 hover:text-foreground",
      )}
    >
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
        isSelected ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
      )}>
        <Award className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{option.label}</p>
        <p className="text-sm text-muted-foreground">{option.description}</p>
      </div>
    </button>
  );
}

interface TicketPreviewProps {
  ticket: Ticket | null;
  draft: DraftDetails;
  selectedService: ServiceOption;
  isGenerating: boolean;
}

function TicketPreview({ ticket, draft, selectedService, isGenerating }: TicketPreviewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useMemo(() => qrDataUrl, [qrDataUrl]);

  useMemo(() => {
    let isActive = true;
    if (!ticket) {
      setQrDataUrl(null);
      return undefined;
    }
    const payload = {
      code: ticket.code,
      service: ticket.service,
      ownerName: ticket.ownerName ?? draft.ownerName,
      woreda: ticket.woreda ?? draft.woreda,
      createdAt: ticket.createdAt,
    };
    QRCode.toDataURL(JSON.stringify(payload), { width: 240, margin: 1 })
      .then((url) => {
        if (isActive) setQrDataUrl(url);
      })
      .catch(() => {
        if (isActive) setQrDataUrl(null);
      });
    return () => {
      isActive = false;
    };
  }, [ticket, draft.ownerName, draft.woreda]);

  const display = ticket
    ? {
        code: ticket.code,
        ownerName: ticket.ownerName ?? draft.ownerName,
        woreda: ticket.woreda ?? draft.woreda,
        notes: ticket.notes ?? draft.notes,
      }
    : {
        code: "Auto-assigned",
        ownerName: draft.ownerName,
        woreda: draft.woreda,
        notes: draft.notes,
      };

  const trackingUrl = ticket ? `https://qflowhq.com/tickets/${ticket.code}` : null;
  const noteLines = display.notes
    ? display.notes.split("\n").map((line) => line.trim()).filter(Boolean)
    : [];

  return (
    <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-sm text-primary">
      <p className="font-semibold uppercase tracking-wide">Ticket preview</p>
      {!ticket && (
        <p className="mt-2 text-primary/80">
          Fill out the form to automatically issue the next order number and generate a QR ticket.
        </p>
      )}
      <div className="mt-4 grid gap-3 text-primary/80">
        <p>
          <span className="font-semibold text-primary">Order number:</span>{" "}
          <span className="font-mono">{display.code}</span>
        </p>
        {display.ownerName && (
          <p>
            <span className="font-semibold text-primary">Property owner:</span>{" "}
            {display.ownerName}
          </p>
        )}
        {display.woreda && (
          <p>
            <span className="font-semibold text-primary">Woreda:</span>{" "}
            {display.woreda}
          </p>
        )}
        <p>
          <span className="font-semibold text-primary">Service:</span>{" "}
          {selectedService.label}
        </p>
        {noteLines.length > 0 && (
          <div>
            <p className="font-semibold text-primary">Notes:</p>
            <ul className="ml-4 mt-1 list-disc space-y-1">
              {noteLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {ticket && trackingUrl && (
          <p>
            <span className="font-semibold text-primary">Tracking URL:</span>{" "}
            {trackingUrl}
          </p>
        )}
        {ticket ? (
          <div className="mt-2 grid place-items-start">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for ticket ${ticket.code}`}
                className="h-40 w-40 rounded-lg bg-white p-2 shadow-inner shadow-primary/30"
              />
            ) : (
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating QR preview…</span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-primary/30 bg-white/70 p-3 text-primary/90">
            <p className="text-xs">
              QR code appears here once you generate the ticket. Reception can print or show it on-screen instantly.
            </p>
          </div>
        )}
        {isGenerating && !ticket && (
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating QR ticket…</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Reception() {
  const [ownerName, setOwnerName] = useState("");
  const [woreda, setWoreda] = useState("");
  const [service, setService] = useState<ServiceType>("S1");
  const [notes, setNotes] = useState("");
  const [priorityCode, setPriorityCode] = useState("");
  const [generatedTicket, setGeneratedTicket] = useState<Ticket | null>(null);

  const selectedService = useMemo(() => {
    const value = generatedTicket?.service ?? service;
    return SERVICE_OPTIONS.find((option) => option.value === value) ?? SERVICE_OPTIONS[0];
  }, [generatedTicket?.service, service]);

  const createTicket = useMutation({
    mutationFn: createTicketRequest,
    onSuccess: (ticket) => {
      setGeneratedTicket(ticket);
      toast.success(`Ticket ${ticket.code} generated`);
      setOwnerName("");
      setWoreda("");
      setNotes("");
      setPriorityCode("");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to create ticket.";
      toast.error(message);
    },
  });

  const isFormValid = ownerName.trim().length > 0 && woreda.length > 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid || createTicket.isPending) return;

    createTicket.mutate({
      service,
      ownerName: ownerName.trim(),
      woreda,
      notes,
      priorityCode,
    });
  };

  const draft: DraftDetails = {
    ownerName,
    woreda,
    notes,
    priorityCode,
    service,
  };

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
            Replace scribbled paper with a structured console built for speed. Every ticket is generated with a single tap, instantly queued, and ready for the guest to scan.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
              <p className="text-xs uppercase text-muted-foreground">Average issuance time</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">42 sec</p>
              <p className="mt-1 text-xs text-muted-foreground">From arrival to QR slip</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
              <p className="text-xs uppercase text-muted-foreground">Priority handling</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">Auto alerts</p>
              <p className="mt-1 text-xs text-muted-foreground">Accessibility & VIP ready</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/60 p-5">
              <p className="text-xs uppercase text-muted-foreground">Training time</p>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                <span className="text-primary">1 shift</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Guided onboarding module</p>
            </div>
          </div>
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-lg shadow-primary/10">
            <h2 className="font-display text-2xl font-semibold text-foreground">Reception script at a glance</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Empower new hires with a consistent approach. Prompts evolve as fields are completed to keep conversations smooth.
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
              Capture the essentials, click “Generate QR Ticket”, and hand the guest a slip—or mirror the QR on screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="order-number">Order number</Label>
                  <Input
                    id="order-number"
                    value={generatedTicket?.code ?? ""}
                    placeholder="Auto-assigned after ticket generation"
                    readOnly
                    className="font-mono"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="owner-name">Property owner's full name</Label>
                  <Input
                    id="owner-name"
                    value={ownerName}
                    onChange={(event) => setOwnerName(event.target.value)}
                    placeholder="Add guest or organization name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="woreda">Woreda</Label>
                  <Select value={woreda} onValueChange={setWoreda}>
                    <SelectTrigger id="woreda">
                      <SelectValue placeholder="Select woreda" />
                    </SelectTrigger>
                    <SelectContent>
                      {WOREDA_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Service type</Label>
                  <div className="grid gap-3">
                    {SERVICE_OPTIONS.map((option) => (
                      <ServiceOptionCard
                        key={option.value}
                        option={option}
                        isSelected={(generatedTicket?.service ?? service) === option.value}
                        onSelect={(value) => {
                          setService(value);
                          setGeneratedTicket(null);
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Context for window team</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="List required documents, accommodations, or quick notes for window staff."
                    className="min-h-[120px]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority-code">Priority code</Label>
                  <Input
                    id="priority-code"
                    value={priorityCode}
                    onChange={(event) => setPriorityCode(event.target.value)}
                    placeholder="Optional – e.g. Accessibility, VIP, Language support"
                  />
                </div>
              </div>

              <TicketPreview
                ticket={generatedTicket}
                draft={draft}
                selectedService={selectedService}
                isGenerating={createTicket.isPending}
              />

              <Button
                type="submit"
                className="h-12 w-full text-base shadow-lg shadow-primary/20"
                disabled={!isFormValid || createTicket.isPending}
              >
                {createTicket.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </span>
                ) : (
                  "Generate QR Ticket"
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                QR auto-refreshes every 60 seconds. Print or display to the guest instantly.
              </p>
            </form>
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
