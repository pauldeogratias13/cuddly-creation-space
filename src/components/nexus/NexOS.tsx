import { motion } from "framer-motion";
import { Shield, Cpu, Globe, Lock, Zap, Server } from "lucide-react";

const stats = [
  { value: "7", label: "Native pillars" },
  { value: "1M+", label: "Writes/sec · ScyllaDB" },
  { value: "<8min", label: "4K transcode · A100" },
  { value: "<300ms", label: "First-frame render" },
];

const SANDBOX_FEATURES = [
  { icon: Cpu, label: "V8 isolate / Docker container", sub: "Strict CPU · memory · egress quotas" },
  { icon: Shield, label: "NEXUS SSO bridge", sub: "OAuth 2.1 scoped API consent" },
  { icon: Globe, label: "appname.nexus.app routing", sub: "TLS managed · custom domain support" },
  { icon: Server, label: "Per-app PostgreSQL schema", sub: "Isolated — no cross-app data access" },
  { icon: Lock, label: "Zero-trust auth", sub: "Keys never leave device Secure Enclave" },
  { icon: Zap, label: "KEDA-scaled infra", sub: "SRE handles all P0 incidents" },
];

export function NexOS() {
  return (
    <section id="nexos" className="relative py-32 px-6 border-t border-border overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 -z-10" />
      <div className="pointer-events-none absolute left-1/3 top-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">§ 03 · NexOS</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              The app ecosystem{" "}
              <span className="text-gradient-aurora">inside NEXUS.</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Paid subscribers can commission bespoke apps — web or mobile — built by the NEXUS team.
              Hosted natively, connected to your identity and payments. A house with everything.
            </p>

            {/* Stats grid */}
            <div className="mt-10 grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
              {stats.map((s) => (
                <div key={s.label} className="bg-surface p-5">
                  <div className="text-3xl sm:text-4xl font-bold text-gradient-aurora">{s.value}</div>
                  <div className="mt-1 text-[10px] font-mono-display uppercase tracking-widest text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Sandbox features */}
            <div className="mt-8 space-y-2">
              <p className="text-xs font-mono-display uppercase tracking-widest text-muted-foreground mb-3">Sandbox Runtime</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SANDBOX_FEATURES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="flex items-start gap-3 rounded-lg border border-border bg-surface/40 p-3">
                      <div className="mt-0.5 h-7 w-7 shrink-0 rounded-md bg-primary/10 grid place-items-center">
                        <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{f.label}</p>
                        <p className="text-[10px] text-muted-foreground">{f.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Right — mock NexOS shell */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-aurora rounded-2xl blur-3xl opacity-20 animate-float-slow" />
            <div className="relative rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-6 shadow-card-elevated overflow-hidden">
              {/* Traffic lights */}
              <div className="flex items-center gap-2 mb-6">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                <span className="ml-3 text-xs font-mono-display text-muted-foreground">nexos://your-app</span>
              </div>

              {/* App list */}
              <div className="space-y-2.5 mb-6">
                {[
                  { name: "Booking Studio", tag: "Live", color: "bg-primary", perf: "12ms p99" },
                  { name: "Loyalty Programme", tag: "Beta", color: "bg-accent", perf: "8ms p99" },
                  { name: "Inventory Sync", tag: "Live", color: "bg-primary", perf: "5ms p99" },
                  { name: "Customer Portal", tag: "Building", color: "bg-violet", perf: "—" },
                  { name: "Analytics Suite", tag: "Live", color: "bg-emerald-500", perf: "18ms p99" },
                ].map((app, i) => (
                  <motion.div
                    key={app.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-border hover:border-border/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-md ${app.color} opacity-80`} />
                      <div>
                        <span className="text-sm font-medium">{app.name}</span>
                        <p className="text-[10px] text-muted-foreground font-mono">{app.perf}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono-display rounded-full px-2 py-0.5 ${
                      app.tag === "Live" ? "bg-emerald-500/20 text-emerald-300" :
                      app.tag === "Beta" ? "bg-amber-500/20 text-amber-300" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {app.tag}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Revenue share callout */}
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-1">Revenue model</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-full h-2 bg-border overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 w-4/5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">80% you · 20% NEXUS</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom tagline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16 rounded-xl border border-border bg-surface/40 p-6 text-center"
        >
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            NexOS turns NEXUS into a{" "}
            <span className="text-foreground font-semibold">'house with everything.'</span>{" "}
            Your business website, booking app, and loyalty programme — all inside NEXUS, all connected
            to your identity and payments. No third-party APIs. No data leakage.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
