import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const links = [
  { label: "Pillars",   href: "#pillars" },
  { label: "Vision",    href: "#vision" },
  { label: "Streaming", href: "#streaming" },
  { label: "Social",    href: "#social" },
  { label: "NexOS",     href: "#nexos" },
  { label: "Pricing",   href: "#pricing" },
  { label: "▶ Feed",    href: null, action: "feed" },
];

export function Nav({ onOpenFeed }: { onOpenFeed?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative h-8 w-8 grid place-items-center">
            <div className="absolute inset-0 bg-aurora rounded-md blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative h-7 w-7 bg-background rounded-md border border-border grid place-items-center">
              <div className="h-3 w-3 bg-aurora rounded-sm" />
            </div>
          </div>
          <span className="font-bold tracking-tight text-lg">
            NEXUS<span className="text-gradient-aurora">.</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {links.map((l) =>
            l.action === "feed" ? (
              <button
                key={l.label}
                type="button"
                onClick={onOpenFeed}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors hover:bg-primary/10"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                {l.label}
              </button>
            ) : (
              <a
                key={l.href}
                href={l.href!}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors hover:bg-surface/50"
              >
                {l.label}
              </a>
            )
          )}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {session ? (
            <Link
              to="/app"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shadow-glow-cyan"
            >
              Open NEXUS
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity shadow-glow-cyan"
              >
                Get early access
              </Link>
            </>
          )}
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle menu"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl px-6 pb-4 space-y-0.5">
          {links.map((l) =>
            l.action === "feed" ? (
              <button
                key={l.label}
                type="button"
                onClick={() => { onOpenFeed?.(); setMobileOpen(false); }}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                {l.label}
              </button>
            ) : (
              <a
                key={l.href}
                href={l.href!}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface/50"
              >
                {l.label}
              </a>
            )
          )}
        </div>
      )}
    </header>
  );
}
