import { motion } from "framer-motion";

const stats = [
  { value: "7", label: "Native pillars" },
  { value: "100K", label: "Members per channel" },
  { value: "4K HDR", label: "Cinema-grade playback" },
  { value: "<400ms", label: "App cold-start" },
];

export function NexOS() {
  return (
    <section
      id="nexos"
      className="relative py-32 px-6 border-t border-border overflow-hidden"
    >
      <div className="absolute inset-0 grid-bg opacity-50 -z-10" />
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">
              § 03 · NexOS
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              The app ecosystem{" "}
              <span className="text-gradient-aurora">inside NEXUS.</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Paid subscribers can commission bespoke apps — web or mobile —
              built by the NEXUS team. Hosted natively, connected to your
              identity and payments. A house with everything.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-surface p-6"
                >
                  <div className="text-3xl sm:text-4xl font-bold text-gradient-aurora">
                    {s.value}
                  </div>
                  <div className="mt-1 text-xs font-mono-display uppercase tracking-widest text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative aspect-square max-w-lg mx-auto w-full"
          >
            <div className="absolute inset-0 bg-aurora rounded-full blur-3xl opacity-30 animate-float-slow" />
            <div className="relative h-full w-full rounded-2xl border border-border bg-surface/60 backdrop-blur-xl p-6 shadow-card-elevated overflow-hidden">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                <span className="ml-3 text-xs font-mono-display text-muted-foreground">
                  nexos://your-app
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Booking Studio", tag: "Live", color: "bg-primary" },
                  { name: "Loyalty Programme", tag: "Beta", color: "bg-accent" },
                  { name: "Inventory Sync", tag: "Live", color: "bg-primary" },
                  { name: "Customer Portal", tag: "Building", color: "bg-violet" },
                  { name: "Analytics Suite", tag: "Live", color: "bg-primary" },
                ].map((app, i) => (
                  <motion.div
                    key={app.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-md ${app.color} opacity-80`} />
                      <span className="text-sm font-medium">{app.name}</span>
                    </div>
                    <span className="text-xs font-mono-display text-muted-foreground">
                      {app.tag}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}