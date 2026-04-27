import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "NEXUS — Your super-app" },
      { name: "description", content: "Your NEXUS dashboard." },
    ],
  }),
  component: AppLayout,
});

function AppLayout() {
  const { session, loading, profile, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <div className="flex items-center gap-3 text-sm font-mono-display uppercase tracking-widest">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
          Loading NEXUS…
        </div>
      </div>
    );
  }

  const name = profile?.display_name ?? session.user.email ?? "you";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-4">
          <Link to="/app" className="flex items-center gap-2.5 group">
            <div className="relative h-8 w-8 grid place-items-center">
              <div className="absolute inset-0 bg-aurora rounded-md blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-7 w-7 bg-background rounded-md border border-border grid place-items-center">
                <div className="h-3 w-3 bg-aurora rounded-sm" />
              </div>
            </div>
            <span className="font-bold tracking-tight text-lg">NEXUS</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/app/profile"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Profile
            </Link>
            <span className="hidden sm:inline text-sm text-muted-foreground">
              Signed in as <span className="text-foreground">{name}</span>
            </span>
            <button
              onClick={() => signOut().then(() => navigate({ to: "/" }))}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
