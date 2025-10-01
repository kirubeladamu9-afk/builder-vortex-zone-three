import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Overview", to: "/" },
  { label: "Reception Console", to: "/reception" },
  { label: "Virtual Queue", to: "/queue" },
];

const SiteHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="relative sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex items-center justify-between gap-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
            QR
          </span>
          <div className="flex flex-col">
            <span className="font-display text-lg font-semibold tracking-tight text-foreground">
              QFlow Virtual Queue
            </span>
            <span className="text-sm text-muted-foreground">
              Scan, wait freely, stay informed
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMenu}
              className={({ isActive }) =>
                cn(
                  "relative rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition",
                  "hover:text-foreground",
                  isActive &&
                    "text-foreground after:absolute after:inset-x-2 after:-bottom-2 after:h-0.5 after:rounded-full after:bg-primary",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="text-sm font-medium text-muted-foreground">
            Experience the future of queuing
          </span>
          <Button asChild className="shadow-lg shadow-primary/20">
            <a href="#get-started">Get Started</a>
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div
        className={cn(
          "md:hidden",
          "absolute left-0 right-0 top-full z-40 origin-top bg-background/95 backdrop-blur transition-all duration-200",
          isMenuOpen
            ? "pointer-events-auto visible translate-y-0 opacity-100"
            : "pointer-events-none invisible -translate-y-3 opacity-0",
        )}
      >
        <div className="container flex flex-col gap-3 py-6">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMenu}
              className={({ isActive }) =>
                cn(
                  "rounded-2xl border border-border/70 bg-card px-5 py-3 text-base font-semibold text-muted-foreground transition",
                  "hover:border-primary/40 hover:text-foreground",
                  isActive && "border-primary/60 text-foreground",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Button
            onClick={closeMenu}
            asChild
            className="h-11 text-base font-semibold"
          >
            <a href="#get-started">Get Started</a>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
