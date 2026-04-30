import { motion } from "framer-motion";
import heroImg from "@/assets/nexus-hero.jpg";

const TECH_STACK = [
  { label: "AV1 · SVT-AV1", sub: "Primary codec · 40% less bandwidth", color: "text-cyan-400" },
  { label: "ScyllaDB", sub: "1M+ writes/sec · Feed events", color: "text-violet-400" },
  { label: "ClickHouse", sub: "100x faster analytics · QoE metrics", color: "text-amber-400" },
  { label: "Qdrant", sub: "Vector similarity · Semantic search", color: "text-emerald-400" },
  { label: "Cassandra 5", sub: "Interaction logs · View events", color: "text-cyan-400" },
  { label: "VMAF ≥ 93", sub: "Quality gate · Every segment scored", color: "text-pink-400" },
  { label: "KEDA Autoscale", sub: "GPU transcoding · Kafka-driven", color: "text-violet-400" },
  { label: "Widevine L1", sub: "4K DRM · TEE-backed hardware", color: "text-amber-400" },
];

const STATS = [
  { value: "<300ms", label: "First-frame render" },
  { value: "<400ms", label: "Cold-start target" },
  { value: "AV1", label: "Primary codec" },
  { value: "4K HDR", label: "Max quality tier" },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pb-16 pt-24">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <img src={heroImg} alt="" aria-hidden className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/70 to-background" />
        <div className="absolute inset-0 grid-bg" />
      </div>

      {/* Glow orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 bottom-1/3 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-mono-display uppercase tracking-widest text-muted-foreground backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
          v4.0 · 2026 Edition · Blueprint Active
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl"
        >
          <span className="text-foreground">The world's first</span>
          <br />
          <span className="text-gradient-aurora">true super-app.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
        >
          Chat. Commerce. Social. Streaming. Gaming. AI. One app engineered to outcompete every
          incumbent — privacy-preserving, streaming-native, unmissable.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#waitlist"
            className="inline-flex items-center justify-center rounded-md bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:scale-[1.02] hover:opacity-90 shadow-glow-cyan"
          >
            Claim your handle
          </a>
          <a
            href="#pillars"
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface/60 px-7 py-3.5 text-base font-medium text-foreground backdrop-blur transition-colors hover:bg-surface-elevated"
          >
            Explore seven pillars →
          </a>
        </motion.div>

        {/* Performance stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mx-auto mt-14 grid max-w-2xl grid-cols-2 gap-px sm:grid-cols-4 rounded-xl overflow-hidden border border-border bg-border"
        >
          {STATS.map((s) => (
            <div key={s.label} className="bg-surface px-4 py-4 text-center">
              <div className="text-2xl font-bold text-gradient-aurora">{s.value}</div>
              <div className="mt-0.5 text-[10px] font-mono-display uppercase tracking-widest text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Tech stack ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.65 }}
          className="mx-auto mt-10 max-w-3xl"
        >
          <p className="mb-4 text-center text-xs font-mono-display uppercase tracking-widest text-muted-foreground/60">
            § Engineering Stack — Faster than TikTok
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TECH_STACK.map((t, i) => (
              <motion.div
                key={t.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.05 }}
                className="rounded-lg border border-border bg-surface/40 px-3 py-2 text-left backdrop-blur hover:bg-surface-elevated transition-colors"
              >
                <p className={`text-xs font-bold font-mono-display ${t.color}`}>{t.label}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">{t.sub}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-mono-display uppercase tracking-widest text-muted-foreground"
        >
          <span>Signal-grade E2E</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>Zero third-party cookies</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>VMAF quality gated</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>Intent-first feed</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>SLSA Level 3</span>
        </motion.div>
      </div>
    </section>
  );
}
