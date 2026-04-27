import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

const links = [
  { label: "Pillars", href: "#pillars" },
  { label: "Vision", href: "#vision" },
  { label: "NexOS", href: "#nexos" },
  { label: "Pricing", href: "#pricing" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
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
          ? "bg-background/70 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative h-8 w-8 grid place-items-center">
            <div className="absolute inset-0 bg-aurora rounded-md blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative h-7 w-7 bg-background rounded-md border border-border grid place-items-center">
              <div className="h-3 w-3 bg-aurora rounded-sm" />
            </div>
          </div>
          <span className="font-bold tracking-tight text-lg">NEXUS</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
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
        </div>
      </div>
    </header>
  );
}