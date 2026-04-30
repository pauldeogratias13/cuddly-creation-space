import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { SuperAppWorkspace } from "@/components/nexus/super-app-workspace";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

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
          Dashboard
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Welcome back, <span className="text-gradient-aurora">{name}</span>.
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Your seven pillars are spinning up. Pick one to begin - or wait for early-access cohorts
          to open across the network.
        </p>
      </motion.div>

      <SuperAppWorkspace name={name} />
    </div>
  );
}
