import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, Phone } from "lucide-react";

const SiteFooter = () => {
  return (
    <footer className="relative overflow-hidden border-t border-border/60 bg-foreground/5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_rgba(14,165,233,0))]" />
      <div className="container relative grid gap-10 py-12 md:grid-cols-[2fr,1fr,1fr] md:py-16">
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
              QR
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">
              QFlow Virtual Queue
            </span>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Transform long lines into effortless experiences. Our QR-powered virtual queuing gives teams real-time control and guests the freedom to wait comfortably from anywhere.
          </p>
          <div className="flex flex-wrap gap-3 text-sm font-medium text-muted-foreground">
            <a className="inline-flex items-center gap-2 hover:text-foreground" href="mailto:hello@qflowhq.com">
              <Mail className="h-4 w-4" /> hello@qflowhq.com
            </a>
            <a className="inline-flex items-center gap-2 hover:text-foreground" href="tel:+15551234567">
              <Phone className="h-4 w-4" /> +1 (555) 123-4567
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Product
          </span>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <Link className="flex items-center gap-2 hover:text-foreground" to="/">
                Overview <ArrowUpRight className="h-4 w-4" />
              </Link>
            </li>
            <li>
              <Link className="flex items-center gap-2 hover:text-foreground" to="/reception">
                Reception Console <ArrowUpRight className="h-4 w-4" />
              </Link>
            </li>
            <li>
              <Link className="flex items-center gap-2 hover:text-foreground" to="/queue">
                Live Queue Monitor <ArrowUpRight className="h-4 w-4" />
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Resources
          </span>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <a className="flex items-center gap-2 hover:text-foreground" href="#get-started">
                Implementation Guide <ArrowUpRight className="h-4 w-4" />
              </a>
            </li>
            <li>
              <a className="flex items-center gap-2 hover:text-foreground" href="#analytics">
                Analytics Dashboard <ArrowUpRight className="h-4 w-4" />
              </a>
            </li>
            <li>
              <a className="flex items-center gap-2 hover:text-foreground" href="#faq">
                FAQs <ArrowUpRight className="h-4 w-4" />
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 bg-background/60 py-5">
        <div className="container flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} QFlow Technologies. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-4">
            <a className="hover:text-foreground" href="#privacy">
              Privacy
            </a>
            <a className="hover:text-foreground" href="#terms">
              Terms
            </a>
            <a className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-primary" href="#status">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Live status
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
