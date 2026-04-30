import { motion } from "framer-motion";
import {
  Sparkles,
  GitBranch,
  ShieldCheck,
  Radio,
  Database,
  Cpu,
  Layers,
  Zap,
  Globe,
  Lock,
  BarChart3,
  Film,
} from "lucide-react";

const VISION_ITEMS = [
  {
    icon: Sparkles,
    title: "Intent-First Feed",
    desc: "Users set mood — learn, create, explore, chill. Feed serves exclusively matching content. No algorithmic bait-and-switch. Thompson Sampling balances exploration vs exploitation.",
    badge: "§01",
  },
  {
    icon: Radio,
    title: "AI Identity Layer",
    desc: "Every user gets an AI twin fine-tuned on their post history. It drafts replies in their voice, summarises threads, and acts as an autonomous agent when offline.",
    badge: "§09",
  },
  {
    icon: GitBranch,
    title: "Evolving Content",
    desc: "Posts can be forked, remixed, and evolved. Content lives as a tree with full provenance — a Git-style immutable history tracked in ClickHouse.",
    badge: "§02",
  },
  {
    icon: ShieldCheck,
    title: "Reputation Graph",
    desc: "Trust scores replace vanity metrics. Influence in 'design' is separate from 'coding.' Earned, not bought. Powered by Neo4j AuraDB social graph traversal.",
    badge: "§08",
  },
];

const ARCH_STACK = [
  {
    icon: Database,
    title: "ScyllaDB · Cassandra 5",
    desc: "1M+ writes/sec. Feed events, interaction logs, video view telemetry. Zero compromise on write throughput.",
    color: "from-cyan-500/20 to-cyan-500/5",
    accent: "text-cyan-400",
  },
  {
    icon: BarChart3,
    title: "ClickHouse Analytics",
    desc: "100× faster aggregations than PostgreSQL. Real-time A/B tests, QoE metrics per CDN PoP, funnel analysis.",
    color: "from-amber-500/20 to-amber-500/5",
    accent: "text-amber-400",
  },
  {
    icon: Layers,
    title: "Qdrant Vector Search",
    desc: "512-dim embeddings for semantic search, content recommendations, and in-video scene retrieval. Sub-5ms at 1B items.",
    color: "from-violet-500/20 to-violet-500/5",
    accent: "text-violet-400",
  },
  {
    icon: Film,
    title: "AV1 · SVT-AV1 Pipeline",
    desc: "Per-title ML bitrate ladders. VMAF ≥ 93 gate. A 2-hour 4K film transcoded in <8 min on A100 GPU clusters.",
    color: "from-pink-500/20 to-pink-500/5",
    accent: "text-pink-400",
  },
  {
    icon: Lock,
    title: "Zero-Trust Security",
    desc: "mTLS between all services. Widevine L1 TEE for 4K. Forensic watermarking traces leaks to account in 30s.",
    color: "from-emerald-500/20 to-emerald-500/5",
    accent: "text-emerald-400",
  },
  {
    icon: Cpu,
    title: "KEDA + GPU Autoscaling",
    desc: "Event-driven scaling on Kafka consumer lag, Redis queue depth. GPU transcode workers scale from zero on upload.",
    color: "from-cyan-500/20 to-cyan-500/5",
    accent: "text-cyan-400",
  },
  {
    icon: Globe,
    title: "Multi-Region Active-Active",
    desc: "Traffic split across 3+ regions. Anycast global load balancing. Failover in <30s. Cilium eBPF networking.",
    color: "from-violet-500/20 to-violet-500/5",
    accent: "text-violet-400",
  },
  {
    icon: Zap,
    title: "Real-Time Feature Pipeline",
    desc: "User signals (dwell, replays, skips) update embeddings live via Kafka → Flink → feature store.",
    color: "from-amber-500/20 to-amber-500/5",
    accent: "text-amber-400",
  },
];

export function Vision() {
  return (
    <section id="vision" className="relative py-32 px-6 border-t border-border overflow-hidden">
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="mx-auto max-w-7xl">
        {/* ── Section 01: Platform Vision ── */}
        <div className="grid lg:grid-cols-12 gap-16 mb-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start"
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">
              § 01 · Platform Vision
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
              Engineered to outcompete{" "}
              <span className="text-gradient-aurora">every incumbent.</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              AI-first, streaming-native, privacy-preserving. Built from the ground up to be
              unmissable — and to give users what they actually asked for.
            </p>
            <div className="mt-8 space-y-2 text-sm font-mono-display text-muted-foreground">
              {[
                "Intent respect principle",
                "Zero third-party cookies",
                "Signal-protocol E2E",
                "On-device ML inference",
              ].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-primary" />
                  {t}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="lg:col-span-7 space-y-4">
            {VISION_ITEMS.map((it, i) => {
              const Icon = it.icon;
              return (
                <motion.div
                  key={it.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group flex gap-5 p-6 rounded-xl border border-border bg-surface/40 hover:bg-surface transition-colors"
                >
                  <div className="shrink-0 h-12 w-12 rounded-lg bg-aurora/10 grid place-items-center border border-border group-hover:shadow-glow-cyan transition-all">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <h3 className="text-lg font-semibold tracking-tight">{it.title}</h3>
                      <span className="shrink-0 text-xs font-mono-display text-muted-foreground/50">
                        {it.badge}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Section: Engineering Stack ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">
            § 08–11 · Engineering Stack
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-3">
            Built faster than TikTok. <span className="text-gradient-aurora">By design.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Every component in the stack was chosen to eliminate latency, maximise quality, and
            protect privacy. No compromise between performance and ethics.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ARCH_STACK.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className={`group relative overflow-hidden rounded-xl border border-border bg-gradient-to-b ${item.color} p-5 hover:border-white/20 transition-all`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-surface-elevated border border-border grid place-items-center">
                    <Icon className={`h-4 w-4 ${item.accent}`} strokeWidth={1.75} />
                  </div>
                  <h3 className={`text-sm font-bold font-mono-display ${item.accent}`}>
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ── Engineering principle manifesto ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-10 rounded-2xl border border-border bg-surface/40 p-8 text-center"
        >
          <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">
            § 13 · Engineering Principle
          </p>
          <blockquote className="text-2xl sm:text-3xl font-semibold leading-snug max-w-3xl mx-auto">
            "Video is a first-class primitive, not an afterthought.{" "}
            <span className="text-gradient-aurora">QoE metrics gate every deploy.</span>"
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">
            NEXUS Architecture v4.0 · Streaming-Native Design Principle
          </p>
        </motion.div>
      </div>
    </section>
  );
}
