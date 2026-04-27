import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — NEXUS" },
      { name: "description", content: "Sign in or create your NEXUS account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/app" });
  }, [loading, session, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
          data: { display_name: displayName || email.split("@")[0] },
        },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      toast.success("Account created. Welcome to NEXUS.");
      navigate({ to: "/app" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
      navigate({ to: "/app" });
    }
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/app`,
    });
    if (result.error) toast.error("Google sign-in failed");
  };

  return (
    <div className="min-h-screen bg-background text-foreground grid-bg">
      <div className="mx-auto max-w-md px-6 py-20">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to NEXUS
        </Link>

        <div className="mt-10 rounded-2xl border border-border bg-surface/60 backdrop-blur p-8">
          <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-3">
            {mode === "signup" ? "Claim your handle" : "Welcome back"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === "signup" ? "Create your NEXUS account" : "Sign in to NEXUS"}
          </h1>

          <button
            type="button"
            onClick={onGoogle}
            className="mt-8 w-full inline-flex items-center justify-center gap-3 rounded-md border border-border bg-surface-elevated px-4 py-3 text-sm font-medium hover:bg-surface transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.2C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.7 16.3 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.2 5.2C40.6 35.4 44 30.1 44 24c0-1.3-.1-2.3-.4-3.5z"/>
            </svg>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-md bg-background border border-border placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            )}
            <input
              type="email"
              required
              placeholder="you@nexus.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-md bg-background border border-border placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-md bg-background border border-border placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:opacity-90 transition shadow-glow-cyan disabled:opacity-60"
            >
              {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New to NEXUS?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
