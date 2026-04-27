import { motion } from "framer-motion";

export function CTA() {
  return (
    <section className="relative py-32 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto max-w-5xl rounded-3xl overflow-hidden border border-border bg-surface p-12 sm:p-20 text-center"
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
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="you@nexus.app"
              className="w-full px-4 py-3.5 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity shadow-glow-cyan whitespace-nowrap"
            >
              Request access
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}