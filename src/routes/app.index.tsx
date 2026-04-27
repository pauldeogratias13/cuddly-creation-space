import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MessageSquare, ShoppingBag, Sparkles, Tv, Globe, Gamepad2, Cpu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const pillars = [
  { icon: MessageSquare, name: "Chat", desc: "Signal-grade E2E messaging." },
  { icon: ShoppingBag, name: "Shop", desc: "Native commerce + escrow." },
  { icon: Sparkles, name: "Social", desc: "Intent-first feed." },
  { icon: Tv, name: "Stream", desc: "4K HDR · Atmos." },
  { icon: Globe, name: "Web", desc: "Sites with custom domains." },
  { icon: Gamepad2, name: "Games", desc: "Cloud + native titles." },
  { icon: Cpu, name: "NexOS", desc: "Bespoke apps." },
];

function Dashboard() {
  const { profile, user } = useAuth();
  const name = profile?.display_name ?? user?.email?.split("@")[0] ?? "you";

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs font-mono-display uppercase tracking-widest text-primary">
          § Dashboard
        </p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">
          Welcome back, <span className="text-gradient-aurora">{name}</span>.
        </h1>
        <p className="mt-4 text-muted-foreground max-w-xl">
          Your seven pillars are spinning up. Pick one to begin — or wait for early-access cohorts to open across the network.
        </p>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pillars.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.button
              key={p.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="text-left group relative rounded-2xl border border-border bg-surface/60 p-6 hover:bg-surface transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-lg bg-aurora/10 border border-border grid place-items-center group-hover:shadow-glow-cyan transition-all">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] font-mono-display uppercase tracking-widest text-muted-foreground">
                  Coming soon
                </span>
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">{p.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{p.desc}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
