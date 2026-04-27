import { motion } from "framer-motion";
import heroImg from "@/assets/nexus-hero.jpg";
import { DEMO_VIDEO_HERO_PREVIEW } from "@/lib/demo-videos";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt=""
          aria-hidden
          className="h-full w-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        <div className="absolute inset-0 grid-bg" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 backdrop-blur px-4 py-1.5 text-xs font-mono-display uppercase tracking-widest text-muted-foreground mb-8"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
          v4.0 · 2026 Edition
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.95]"
        >
          <span className="text-foreground">The world's first</span>
          <br />
          <span className="text-gradient-aurora">true super-app.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Chat. Commerce. Social. Streaming. Gaming. An AI-first app ecosystem.
          NEXUS replaces a dozen apps with one — natively built, privacy-preserving, unmissable.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <a
            href="#waitlist"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-7 py-3.5 text-base font-semibold hover:opacity-90 transition-all shadow-glow-cyan hover:scale-[1.02]"
          >
            Claim your handle
          </a>
          <a
            href="#pillars"
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface/60 backdrop-blur px-7 py-3.5 text-base font-medium text-foreground hover:bg-surface-elevated transition-colors"
          >
            Explore the seven pillars →
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mx-auto mt-14 w-full max-w-3xl text-left"
        >
          <p className="mb-2 text-center text-xs font-mono-display uppercase tracking-widest text-muted-foreground">
            Sample stream (test video)
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-black shadow-card-elevated">
            <video
              className="aspect-video w-full object-contain"
              controls
              playsInline
              preload="metadata"
              src={DEMO_VIDEO_HERO_PREVIEW}
            />
          </div>
          <p className="mt-2 break-all text-center font-mono text-[10px] text-muted-foreground">
            {DEMO_VIDEO_HERO_PREVIEW}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-xs font-mono-display uppercase tracking-widest text-muted-foreground"
        >
          <span>Signal-grade E2E</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>4K HDR · Atmos</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>On-device AI</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>Zero-knowledge</span>
        </motion.div>
      </div>
    </section>
  );
}