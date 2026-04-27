import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CTA() {
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const { error } = await supabase.from("waitlist").insert({
      email: email.trim(),
      handle: handle.trim() || null,
      source: "landing_cta",
    });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.success("You're already on the list — see you soon.");
        setDone(true);
      } else {
        toast.error("Couldn't submit. Check your email and try again.");
      }
      return;
    }
    toast.success("You're in. We'll be in touch.");
    setDone(true);
  };

  return (
    <section className="relative py-32 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        id="waitlist"
        className="relative mx-auto max-w-5xl rounded-3xl overflow-hidden border border-border bg-surface p-12 sm:p-20 text-center scroll-mt-24"
      >
        <div className="absolute inset-0 bg-aurora opacity-20" />
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="relative">
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
            One app.{" "}
            <span className="text-gradient-aurora">Everything you do.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            Be among the first to claim your handle on NEXUS. Limited early
            access cohorts open monthly.
          </p>
          {done ? (
            <div className="mt-10 inline-flex items-center gap-2 rounded-md border border-primary/40 bg-surface-elevated px-5 py-3 text-sm text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              You're on the NEXUS waitlist.
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mt-10 flex flex-col items-center gap-3 max-w-md mx-auto"
            >
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@your-handle (optional)"
                maxLength={32}
                className="w-full px-4 py-3.5 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <div className="flex flex-col sm:flex-row w-full gap-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@nexus.app"
                  className="w-full px-4 py-3.5 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity shadow-glow-cyan whitespace-nowrap disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Request access"}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                No spam. We'll only email you about your cohort.
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </section>
  );
}