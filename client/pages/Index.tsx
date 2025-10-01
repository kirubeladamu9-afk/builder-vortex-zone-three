import { Link } from "react-router-dom";
import {
  ArrowRight,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  LineChart,
  Monitor,
  QrCode,
  Smartphone,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

const HERO_STATS = [
  {
    label: "Average wait time",
    value: "−37%",
    caption: "after 4 weeks with smart triage",
  },
  {
    label: "Tickets processed",
    value: "480+",
    caption: "per day across 6 windows",
  },
  {
    label: "Satisfaction score",
    value: "4.8/5",
    caption: "based on customer exit surveys",
  },
];

interface PhaseHighlight {
  title: string;
  description: string;
  icon: LucideIcon;
}

const PHASES: Array<{
  phase: string;
  title: string;
  caption: string;
  highlights: PhaseHighlight[];
}> = [
  {
    phase: "Phase 1",
    title: "Reception & Virtual Ticket Issuance",
    caption:
      "Front desk teams generate QR-driven tickets instantly—no phone numbers required.",
    highlights: [
      {
        title: "Eligibility confirmed",
        description:
          "Customer arrives and an employer verifies service eligibility before proceeding.",
        icon: ClipboardCheck,
      },
      {
        title: "Generate QR ticket",
        description:
          "One click assigns ticket S1-015, sets service type, and calculates the queue position.",
        icon: QrCode,
      },
      {
        title: "Deliver ticket experience",
        description:
          "Print the slip or present it on-screen—customers scan to keep their queue at their fingertips.",
        icon: Smartphone,
      },
      {
        title: "Set expectations",
        description:
          "Employer confirms lounge instructions so guests know to relax until their turn arrives.",
        icon: BellRing,
      },
    ],
  },
  {
    phase: "Phase 2",
    title: "Intelligent Virtual Waiting Room",
    caption:
      "Real-time updates follow the customer anywhere on site with on-screen prompts and displays.",
    highlights: [
      {
        title: "Freedom to roam",
        description:
          "Guests get live wait-time estimates with every scan while screens broadcast current numbers.",
        icon: Users,
      },
      {
        title: "Dynamic alerts",
        description:
          "When placement shifts, the QR status nudges: ‘You’re up next—head to the waiting area.’",
        icon: CalendarClock,
      },
      {
        title: "Now serving precision",
        description:
          "The QR page switches to instructions: ‘Please proceed to Window 3 for Social Services.’",
        icon: Monitor,
      },
      {
        title: "Continuous tracking",
        description:
          "Staff dashboards visualize queue health, enabling proactive service balancing in real time.",
        icon: LineChart,
      },
    ],
  },
];

const MONITORING_OPTIONS: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  metric: string;
}> = [
  {
    title: "QR status mini-site",
    description:
      "Scoped, ticket-specific portal refreshed with every scan—position, wait estimate, and live prompts all in one view.",
    icon: Smartphone,
    metric: "Used by 92% of guests",
  },
  {
    title: "Lobby display sync",
    description:
      "Large format dashboard mirroring ‘Now Serving’ to keep crowds informed without pulling out a device.",
    icon: Monitor,
    metric: "Latency under 2 seconds",
  },
  {
    title: "Staff alerting",
    description:
      "Reception gets notified when VIP or accessibility profiles reach the top so they can escort personally.",
    icon: BellRing,
    metric: "Zero missed calls",
  },
];

const FAQS = [
  {
    question: "Do customers need to download an app?",
    answer:
      "No apps, logins, or phone numbers are required. Each ticket’s QR links to a secure, single-use status page accessible from any camera-enabled device.",
  },
  {
    question: "How does the system handle walk-ins without phones?",
    answer:
      "Staff can print a QR slip. Lobby displays mirror all updates so guests without devices can still track their turn comfortably.",
  },
  {
    question: "Can multiple services run simultaneously?",
    answer:
      "Yes. Service types, windows, and priority rules are configurable. The queue engine balances load while maintaining promised service-level agreements.",
  },
  {
    question: "What analytics are available?",
    answer:
      "Dashboards expose average wait, abandonment rates, service time per agent, and live throughput so managers can adapt staffing in minutes, not days.",
  },
];

const QR_MATRIX = [
  "1111110",
  "1000001",
  "1011101",
  "1010101",
  "1011101",
  "1000001",
  "0111111",
];

const SampleQRCode = () => (
  <div className="grid grid-cols-7 gap-1 rounded-2xl bg-white p-3 shadow-inner shadow-primary/10">
    {QR_MATRIX.flatMap((row, rowIndex) =>
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

const TicketSnapshot = () => (
  <div className="relative rounded-3xl border border-border/70 bg-card/90 p-6 shadow-xl shadow-primary/10 backdrop-blur">
    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
      <span>Virtual ticket</span>
      <span>Window 3</span>
    </div>
    <div className="mt-4 flex flex-col gap-6 rounded-2xl bg-background/80 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Ticket number
          </p>
          <p className="font-display text-4xl font-semibold text-foreground">
            S1-015
          </p>
          <p className="text-sm text-muted-foreground">
            Service: Social Security Renewal
          </p>
        </div>
        <SampleQRCode />
      </div>
      <div className="grid gap-3 text-sm">
        <div className="flex items-center justify-between rounded-2xl bg-secondary/60 px-4 py-3">
          <span className="font-medium text-secondary-foreground">
            Position in line
          </span>
          <span className="font-display text-lg text-foreground">#4</span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-accent/60 px-4 py-3">
          <span className="font-medium text-accent-foreground">
            Estimated wait
          </span>
          <span className="font-display text-lg text-foreground">
            07:45 min
          </span>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-primary/10 px-4 py-3 text-sm">
          <span className="font-medium text-primary">Status</span>
          <span className="font-display text-base text-primary">
            You’re next—head to waiting area
          </span>
        </div>
      </div>
    </div>
    <div className="mt-6 rounded-2xl border border-border/70 bg-background/80 p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>Now serving</span>
        <span>Updated moments ago</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm font-semibold text-foreground">
        <div className="rounded-xl bg-primary/10 px-4 py-3">
          <p className="text-xs uppercase text-muted-foreground">Window 1</p>
          <p className="font-display text-lg">S1-012</p>
        </div>
        <div className="rounded-xl bg-primary px-4 py-3 text-primary-foreground">
          <p className="text-xs uppercase text-primary-foreground/70">
            Window 2
          </p>
          <p className="font-display text-lg">S1-013</p>
        </div>
        <div className="rounded-xl bg-primary/10 px-4 py-3">
          <p className="text-xs uppercase text-muted-foreground">Window 3</p>
          <p className="font-display text-lg">S1-014</p>
        </div>
      </div>
    </div>
  </div>
);

const MonitoringCard = ({
  title,
  description,
  icon: Icon,
  metric,
}: (typeof MONITORING_OPTIONS)[number]) => (
  <Card className="h-full border-border/60 bg-card/80 backdrop-blur">
    <CardHeader className="space-y-4">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
      <CardDescription className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </CardDescription>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="inline-flex items-center gap-2 rounded-full bg-secondary/60 px-3 py-1 text-xs font-semibold text-secondary-foreground">
        <CheckCircle2 className="h-4 w-4" /> {metric}
      </div>
    </CardContent>
  </Card>
);

const PhaseCard = ({
  phase,
  title,
  caption,
  highlights,
}: (typeof PHASES)[number]) => (
  <Card className="h-full border-border/60 bg-card/80 p-6 shadow-lg shadow-primary/5 backdrop-blur">
    <div className="flex items-center justify-between">
      <Badge
        variant="secondary"
        className="rounded-full border-none px-3 py-1 text-xs font-semibold"
      >
        {phase}
      </Badge>
      <QrCode className="h-6 w-6 text-primary" />
    </div>
    <h3 className="mt-5 font-display text-2xl font-semibold text-foreground">
      {title}
    </h3>
    <p className="mt-2 text-sm text-muted-foreground">{caption}</p>
    <div className="mt-6 space-y-5">
      {highlights.map(
        ({ title: itemTitle, description, icon: Icon }, index) => (
          <div
            key={itemTitle}
            className="flex items-start gap-4 rounded-2xl border border-border/60 bg-background/60 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {index + 1}. {itemTitle}
              </p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        ),
      )}
    </div>
  </Card>
);

export default function Index() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(20,158,255,0.22),_transparent_60%)]" />
        <div className="container grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="space-y-8">
            <Badge className="w-fit rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-primary">
              QR-powered virtual queuing
            </Badge>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Keep your queues moving with{" "}
              <span className="bg-gradient-to-r from-primary via-sky-500 to-indigo-500 bg-clip-text text-transparent">
                QR smart tickets
              </span>
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Give every guest a personal status page they can scan anytime.
              Replace phone-dependent updates with intuitive QR codes and
              ambient displays that keep everyone relaxed and ready.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 px-6 text-base shadow-lg shadow-primary/30"
              >
                <Link to="/reception">
                  Launch reception console
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 border-border/70 bg-background/70 px-6 text-base"
              >
                <a href="#journey">See the step-by-step flow</a>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-2 font-display text-3xl font-semibold text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.caption}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[32px] bg-gradient-to-br from-primary/20 via-sky-400/10 to-indigo-500/10 blur-2xl" />
            <TicketSnapshot />
          </div>
        </div>
      </section>

      <section
        id="journey"
        className="relative border-t border-border/60 bg-foreground/5 py-20 md:py-24"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(20,158,255,0.12),_transparent_70%)]" />
        <div className="container space-y-12">
          <div className="max-w-2xl space-y-4">
            <Badge
              variant="secondary"
              className="rounded-full border-none px-4 py-1 text-xs font-semibold"
            >
              Step-by-step process
            </Badge>
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
              Designed around people, optimized for throughput
            </h2>
            <p className="text-lg text-muted-foreground">
              Every action from arrival to service is captured in a guided
              workflow. QR codes become living tickets—updating the moment staff
              move the queue forward.
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {PHASES.map((phase) => (
              <PhaseCard key={phase.phase} {...phase} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-24">
        <div className="container grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-6">
            <Badge
              variant="secondary"
              className="rounded-full border-none px-4 py-1 text-xs font-semibold"
            >
              Monitoring options
            </Badge>
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
              Every guest stays in the loop—no phones required
            </h2>
            <p className="text-lg text-muted-foreground">
              Customers can scan or simply glance at the lobby display.
              Meanwhile, staff get instant alerts for priorities, so nobody
              waits unsure of what happens next.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 text-sm text-primary">
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5" />
                  <span className="font-semibold uppercase tracking-wide">
                    QR + Screen = hybrid comfort
                  </span>
                </div>
                <p className="mt-3 text-primary/80">
                  Guests move freely, confident that a quick scan or glance
                  tells them exactly what to do next.
                </p>
              </div>
              <div className="rounded-2xl border border-accent/40 bg-accent/40 p-5 text-sm text-accent-foreground">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5" />
                  <span className="font-semibold uppercase tracking-wide">
                    Accurate wait forecasting
                  </span>
                </div>
                <p className="mt-3 text-accent-foreground/80">
                  Machine learning refines wait predictions every five minutes
                  using live throughput.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-6">
            {MONITORING_OPTIONS.map((option) => (
              <MonitoringCard key={option.title} {...option} />
            ))}
          </div>
        </div>
      </section>

      <section
        id="analytics"
        className="relative border-y border-border/60 bg-foreground/5 py-20 md:py-24"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.16),_transparent_70%)]" />
        <div className="container grid gap-10 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
          <div className="space-y-5">
            <Badge
              variant="secondary"
              className="rounded-full border-none px-4 py-1 text-xs font-semibold"
            >
              Command center
            </Badge>
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
              See queue health at a glance and adapt instantly
            </h2>
            <p className="text-lg text-muted-foreground">
              A live dashboard shows throughput, average service times, and
              abandonments. Export data or trigger automations when thresholds
              are met.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Autocomplete
                service reports with window-level metrics.
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Predict peak
                congestion with rolling forecasts.
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Trigger SMS,
                email, or on-site notifications if SLAs slip.
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-border/70 bg-background/70 p-8 shadow-xl shadow-primary/10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Throughput today
                </p>
                <p className="mt-1 font-display text-4xl font-semibold text-foreground">
                  312 guests served
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <ArrowRight className="h-4 w-4" /> 12% faster than yesterday
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  Average wait
                </p>
                <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                  08:21 min
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Down from 13:15 last month
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  Abandonment rate
                </p>
                <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                  1.7%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Goal: keep under 3%
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  Service alignment
                </p>
                <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                  98% on time
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Window balancing automation engaged
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card/80 p-4">
                <p className="text-xs uppercase text-muted-foreground">
                  Feedback pulse
                </p>
                <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                  4.8 / 5
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Surveyed after completion
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="get-started" className="relative py-20 md:py-24">
        <div className="container grid gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div className="space-y-5">
            <Badge
              variant="secondary"
              className="rounded-full border-none px-4 py-1 text-xs font-semibold"
            >
              Rollout plan
            </Badge>
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
              Launch QR-powered queuing in three days
            </h2>
            <p className="text-lg text-muted-foreground">
              We deliver templates, staff scripts, and digital signage assets so
              your team can pilot without friction.
            </p>
            <div className="space-y-4">
              {[
                "Configure services & windows",
                "Train reception with guided prompts",
                "Go live with beautiful lobby screens",
              ].map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 p-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {index + 1}
                  </div>
                  <p className="text-sm font-medium text-foreground">{step}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Dedicated
              onboarding specialist included
            </div>
          </div>
          <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-xl shadow-primary/10">
            <h3 className="font-display text-2xl font-semibold text-foreground">
              Front-desk script
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              “This is your virtual ticket. Scan it anytime to see your place in
              line. Please relax in the lounge—we&apos;ll notify you when
              it&apos;s your turn.”
            </p>
            <div className="mt-6 space-y-3">
              {[
                {
                  label: "Ticket number",
                  value: "S1-015",
                },
                {
                  label: "Service type",
                  value: "Social Security Renewal",
                },
                {
                  label: "Queue position",
                  value: "4th in line",
                },
                {
                  label: "Tracking URL",
                  value: "qflowhq.com/tickets/S1-015",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl bg-background/60 px-4 py-3"
                >
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="font-medium text-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <Button
              asChild
              size="lg"
              className="mt-8 h-12 w-full text-base shadow-lg shadow-primary/20"
            >
              <Link to="/queue">Preview customer view</Link>
            </Button>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="relative border-t border-border/60 bg-foreground/5 py-20 md:py-24"
      >
        <div className="container grid gap-12 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="space-y-5">
            <Badge
              variant="secondary"
              className="rounded-full border-none px-4 py-1 text-xs font-semibold"
            >
              FAQ
            </Badge>
            <h2 className="font-display text-3xl font-semibold text-foreground md:text-4xl">
              Answers to common roll-out questions
            </h2>
            <p className="text-lg text-muted-foreground">
              From accessibility to multi-location deployment, QFlow gives teams
              everything needed to modernize the lobby experience.
            </p>
          </div>
          <Accordion
            type="single"
            collapsible
            className="w-full divide-y divide-border/60 rounded-3xl border border-border/60 bg-background/80"
          >
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index + 1}`}>
                <AccordionTrigger className="px-6 text-left text-base font-semibold text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
