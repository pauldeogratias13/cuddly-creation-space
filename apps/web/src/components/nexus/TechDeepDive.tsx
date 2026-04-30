import { motion } from "framer-motion";
import {
  Brain,
  Shield,
  Zap,
  Database,
  Globe,
  Lock,
  Cpu,
  BarChart3,
  Eye,
  GitBranch,
  Radio,
  Layers,
  Server,
  AlertTriangle,
  RefreshCw,
  Fingerprint,
} from "lucide-react";

/* ── Backend / Identity features ──────────────────────────────────────── */
const IDENTITY_FEATURES = [
  {
    icon: Fingerprint,
    title: "Passkeys (WebAuthn)",
    sub: "§ 08 · Identity",
    desc: "Passwordless authentication. FIDO2 hardware-bound keys. Phishing-proof by design — no credential to steal.",
    color: "text-cyan-400",
    border: "border-cyan-500/25",
    bg: "bg-cyan-500/8",
  },
  {
    icon: Globe,
    title: "Decentralised Identity",
    sub: "DID · Self-Sovereign",
    desc: "Optional DID (Decentralised Identifiers) for self-sovereign identity. Portable across platforms, user-owned.",
    color: "text-violet-400",
    border: "border-violet-500/25",
    bg: "bg-violet-500/8",
  },
  {
    icon: Shield,
    title: "Zero-Knowledge Proofs",
    sub: "zk-SNARKs via gnark",
    desc: "Age verification and credential checks without revealing underlying data. Math-guaranteed privacy.",
    color: "text-emerald-400",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/8",
  },
  {
    icon: Lock,
    title: "Multi-Persona Vault",
    sub: "Cryptographically isolated",
    desc: "Switching identity generates a new ephemeral session token. Personas are cryptographically unlinkable, not just UI toggles.",
    color: "text-pink-400",
    border: "border-pink-500/25",
    bg: "bg-pink-500/8",
  },
  {
    icon: Zap,
    title: "Adaptive MFA",
    sub: "Risk-scored · context-aware",
    desc: "Low-risk logins skip 2FA. High-risk events enforce hardware key. Continuous risk scoring on every request.",
    color: "text-amber-400",
    border: "border-amber-500/25",
    bg: "bg-amber-500/8",
  },
  {
    icon: GitBranch,
    title: "gRPC-Native Microservices",
    sub: "Event-sourced · Failure-tolerant",
    desc: "All service-to-service calls use gRPC. Circuit breakers, retries with exponential backoff, and mandatory fallback paths.",
    color: "text-cyan-400",
    border: "border-cyan-500/25",
    bg: "bg-cyan-500/8",
  },
];

/* ── Feed Ranking Engine ──────────────────────────────────────────────── */
const RANKING_FEATURES = [
  {
    icon: Brain,
    title: "Two-Tower Neural Retrieval",
    desc: "Candidate retrieval via ANN on 512-dim user + content embeddings. Sub-5ms at 1 billion items.",
    color: "text-violet-400",
  },
  {
    icon: Zap,
    title: "Thompson Sampling Re-Ranker",
    desc: "Balances exploit (known preferences) vs explore (serendipity). Boredom detected in fewer than 10 interactions.",
    color: "text-cyan-400",
  },
  {
    icon: Radio,
    title: "Real-Time Feature Pipeline",
    desc: "Dwell, replays, skips — all update embeddings instantly via Kafka → Flink → feature store.",
    color: "text-amber-400",
  },
  {
    icon: Layers,
    title: "WASM Plugin System",
    desc: "Third-party ranking plugins compiled to WebAssembly. Sandboxed execution inside the ranker. Microsecond overhead.",
    color: "text-emerald-400",
  },
];

/* ── AI & ML Systems ──────────────────────────────────────────────────── */
const AI_FEATURES = [
  {
    icon: Brain,
    title: "Style Mimic LLM",
    sub: "LLaMA 3 / Mistral fine-tuned",
    desc: "Fine-tuned on user post history. Generates replies, captions, and summaries in the user's exact voice.",
    color: "text-violet-400",
    border: "border-violet-500/25",
    bg: "bg-violet-500/8",
  },
  {
    icon: Radio,
    title: "Autonomous Agent Mode",
    sub: "Opt-in · offline-active",
    desc: "AI twin can browse feed, react, comment, and schedule posts when user is offline. Fully opt-in.",
    color: "text-cyan-400",
    border: "border-cyan-500/25",
    bg: "bg-cyan-500/8",
  },
  {
    icon: Lock,
    title: "Persona Isolation",
    sub: "Separate embedding spaces",
    desc: "Each persona has an independent embedding space. Public, anonymous, and creator voices never bleed into each other.",
    color: "text-pink-400",
    border: "border-pink-500/25",
    bg: "bg-pink-500/8",
  },
  {
    icon: Database,
    title: "Memory Graph",
    sub: "RAG · Personal knowledge graph",
    desc: "Structured long-term memory via RAG over personal knowledge graph. AI remembers your opinions, relationships, history.",
    color: "text-amber-400",
    border: "border-amber-500/25",
    bg: "bg-amber-500/8",
  },
  {
    icon: Eye,
    title: "Video Content AI",
    sub: "Per-user highlight reels",
    desc: "Generates personalised short highlight clips from long-form content based on user taste graph.",
    color: "text-emerald-400",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/8",
  },
  {
    icon: Layers,
    title: "Multi-modal Embeddings",
    sub: "CLIP / SigLIP unified space",
    desc: "Text, image, audio, and video unified in one semantic space for true cross-modal search and recommendations.",
    color: "text-cyan-400",
    border: "border-cyan-500/25",
    bg: "bg-cyan-500/8",
  },
  {
    icon: AlertTriangle,
    title: "Toxicity & Safety",
    sub: "Llama Guard 3 · custom classifiers",
    desc: "Multi-label classification: hate / NSFW / misinformation / spam. Runs on every piece of content at ingest.",
    color: "text-rose-400",
    border: "border-rose-500/25",
    bg: "bg-rose-500/8",
  },
  {
    icon: Cpu,
    title: "On-Device Inference",
    sub: "Core ML · ONNX Runtime",
    desc: "All user-level AI runs locally. No behaviour data ever sent to the cloud. Privacy and speed simultaneously.",
    color: "text-violet-400",
    border: "border-violet-500/25",
    bg: "bg-violet-500/8",
  },
];

/* ── Data Architecture ───────────────────────────────────────────────── */
const DATA_STORES = [
  {
    name: "PostgreSQL 16",
    role: "Primary relational store",
    uses: [
      "Users, metadata, payments",
      "Content catalogue, entitlements",
      "Moderation records",
      "pgvector extension for embeddings",
      "Citus for horizontal sharding",
    ],
    color: "text-cyan-400",
    border: "border-cyan-500/25",
    bg: "from-cyan-500/10 to-cyan-500/5",
    badge: "§ 10A",
  },
  {
    name: "Cassandra 5 / ScyllaDB",
    role: "High-throughput write store",
    uses: [
      "Feed events · 1M+ writes/sec",
      "Interaction logs (dwell/skip/replay)",
      "Notification history",
      "Video view events",
      "Zero-downtime rolling upgrades",
    ],
    color: "text-violet-400",
    border: "border-violet-500/25",
    bg: "from-violet-500/10 to-violet-500/5",
    badge: "§ 10B",
  },
  {
    name: "ClickHouse",
    role: "Analytics & QoE engine",
    uses: [
      "A/B test results · funnel analysis",
      "Video QoE per CDN PoP",
      "CDN log aggregation",
      "100× faster than PostgreSQL",
      "1-second granularity metrics",
    ],
    color: "text-amber-400",
    border: "border-amber-500/25",
    bg: "from-amber-500/10 to-amber-500/5",
    badge: "§ 10C",
  },
  {
    name: "Redis 7 Cluster",
    role: "Cache · realtime · rate-limit",
    uses: [
      "Session store · feed cache",
      "Rate limit counters",
      "Pub/sub for realtime events",
      "Redis Stack: Search + JSON + TimeSeries",
      "Sub-millisecond response",
    ],
    color: "text-pink-400",
    border: "border-pink-500/25",
    bg: "from-pink-500/10 to-pink-500/5",
    badge: "§ 10D",
  },
  {
    name: "Qdrant",
    role: "Vector similarity search",
    uses: [
      "Content recommendations",
      "Semantic feed search",
      "In-video scene retrieval",
      "512-dim embeddings",
      "Sub-5ms at 1B items",
    ],
    color: "text-emerald-400",
    border: "border-emerald-500/25",
    bg: "from-emerald-500/10 to-emerald-500/5",
    badge: "§ 10E",
  },
  {
    name: "Neo4j AuraDB",
    role: "Social graph engine",
    uses: [
      "Friend-of-friend traversal",
      "Interest clustering",
      "Trust propagation",
      "Reputation graph queries",
      "Cypher queries · millisecond hops",
    ],
    color: "text-cyan-400",
    border: "border-cyan-500/25",
    bg: "from-cyan-500/10 to-cyan-500/5",
    badge: "§ 10F",
  },
];

/* ── Infrastructure & DevOps ─────────────────────────────────────────── */
const INFRA_ITEMS = [
  {
    icon: Globe,
    title: "Multi-Region Active-Active",
    desc: "Traffic split across 3+ regions. Anycast global load balancing. Automatic failover in <30 seconds.",
    color: "text-cyan-400",
  },
  {
    icon: Zap,
    title: "Cilium eBPF Networking",
    desc: "eBPF-based CNI replaces iptables. Transparent WireGuard encryption, network policy, and 10× throughput uplift.",
    color: "text-violet-400",
  },
  {
    icon: Cpu,
    title: "KEDA Event-Driven Autoscaling",
    desc: "Kafka consumer lag, Redis queue depth, HTTP RPS, CDN bandwidth — all drive HPA decisions. GPU nodes scale from 0.",
    color: "text-amber-400",
  },
  {
    icon: GitBranch,
    title: "GitOps with Flux CD",
    desc: "All cluster state is code. Every change is a Git commit. Drift detection and auto-remediation. Rollback in <60s.",
    color: "text-emerald-400",
  },
  {
    icon: Server,
    title: "GPU Transcoding Pool",
    desc: "Dedicated NVIDIA A100/H100 node pool. KEDA scales transcode workers from 0 on upload queue depth.",
    color: "text-pink-400",
  },
  {
    icon: BarChart3,
    title: "Observability Stack",
    desc: "Prometheus + Thanos · Jaeger/Tempo (traces) · Loki (logs) · Grafana dashboards · Video QoE per CDN PoP.",
    color: "text-cyan-400",
  },
];

/* ── Security ─────────────────────────────────────────────────────────── */
const SECURITY_ITEMS = [
  {
    icon: Shield,
    title: "Zero-Trust Network",
    desc: "No implicit trust. Every request authenticated and authorised. mTLS between all services.",
    color: "text-emerald-400",
  },
  {
    icon: GitBranch,
    title: "SLSA Level 3 Supply Chain",
    desc: "SBOM for every build. Cosign signs all container images. Dependabot + Renovate for dep hygiene.",
    color: "text-cyan-400",
  },
  {
    icon: Lock,
    title: "HashiCorp Vault",
    desc: "Dynamic secrets. DB credentials rotate every 15 minutes. No long-lived credentials in env vars, ever.",
    color: "text-violet-400",
  },
  {
    icon: AlertTriangle,
    title: "DDoS / Bot Defence",
    desc: "Cloudflare Turnstile (invisible CAPTCHA) · ML-based bot fingerprinting · token bucket rate limiting.",
    color: "text-amber-400",
  },
  {
    icon: Eye,
    title: "Ad Fraud Prevention",
    desc: "ML-based click fraud detection. IVT scoring per impression. Advertisers credited automatically for fraudulent impressions.",
    color: "text-pink-400",
  },
  {
    icon: RefreshCw,
    title: "Progressive Delivery",
    desc: "Feature flags for 100% of releases. Dark launches → canary 1% → 10% → 50% → GA. Rollback in <60 seconds.",
    color: "text-emerald-400",
  },
];

/* ── Engineering Principles ──────────────────────────────────────────── */
const PRINCIPLES = [
  {
    num: "01",
    title: "Default to Open Standards",
    desc: "Prefer IETF/W3C/CNCF over proprietary lock-in. Every vendor choice must have a documented open alternative.",
  },
  {
    num: "02",
    title: "Design for Failure",
    desc: "Every service assumes dependencies will fail. Circuit breakers, retries with exponential backoff, and fallback paths are mandatory.",
  },
  {
    num: "03",
    title: "Data Minimisation",
    desc: "Collect only what is needed. Retention policies enforced at storage layer, not just in policy documents.",
  },
  {
    num: "04",
    title: "Progressive Delivery",
    desc: "Feature flags for 100% of releases. Dark launches, canary at 1% → 10% → 50% → GA. Rollback in <60 seconds.",
  },
  {
    num: "05",
    title: "Async Everything",
    desc: "Synchronous calls only for user-facing critical path. Everything else: message queue, event stream, or background job.",
  },
  {
    num: "06",
    title: "Measure Everything",
    desc: "SLIs for every external API. Error budget burn rate alerts. Chaos tests in staging weekly. Video QoE tracked per CDN PoP.",
  },
  {
    num: "07",
    title: "Streaming-Native Design",
    desc: "Video is a first-class primitive, not an afterthought. QoE metrics gate every deploy. A single rebuffer is a bug.",
  },
  {
    num: "08",
    title: "Intent Respect Principle",
    desc: "No feature, ad, or notification may interrupt a user who has declared their current intent. Mood context gates all push surfaces.",
  },
];

export function TechDeepDive() {
  return (
    <section id="tech" className="relative py-32 px-6 border-t border-border overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-20 -z-10" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-violet-500/5 blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl space-y-28">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">
            § 08–13 · Backend · AI · Data · Infrastructure · Security
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            The full stack. <span className="text-gradient-aurora">Nothing hidden.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Every layer of NEXUS — from identity microservices to AI inference to database sharding
            to GitOps delivery — is architected with one goal: a platform users can't imagine living
            without.
          </p>
        </motion.div>

        {/* ── § 08 Backend: Identity + Feed Ranking ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-2">
              § 08A · Identity Service — Go
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Passwordless. Persona-aware.{" "}
              <span className="text-gradient-aurora">Zero-knowledge.</span>
            </h3>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              The identity service is written in Go for maximum concurrency. It powers passkeys,
              decentralised identity, multi-persona vaults, and risk-scored adaptive MFA.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {IDENTITY_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className={`rounded-xl border ${f.border} ${f.bg} p-5`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-9 w-9 rounded-lg bg-surface-elevated border border-border grid place-items-center shrink-0">
                      <Icon className={`h-4 w-4 ${f.color}`} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p
                        className={`text-[9px] font-mono-display uppercase tracking-widest ${f.color}`}
                      >
                        {f.sub}
                      </p>
                      <h4 className="text-sm font-bold leading-tight">{f.title}</h4>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Feed Ranking */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-16 mb-8"
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-2">
              § 08B · Feed Ranking Engine — Rust
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Two-tower retrieval.{" "}
              <span className="text-gradient-aurora">Sub-5ms at 1 billion items.</span>
            </h3>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RANKING_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="rounded-xl border border-border bg-surface/40 p-5 hover:bg-surface transition-colors"
                >
                  <div
                    className={`h-9 w-9 rounded-lg bg-surface-elevated border border-border grid place-items-center mb-3`}
                  >
                    <Icon className={`h-4 w-4 ${f.color}`} strokeWidth={1.75} />
                  </div>
                  <h4 className={`text-sm font-bold mb-2 ${f.color}`}>{f.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── § 09 AI & ML Systems ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-2">
              § 09 · AI &amp; ML Systems
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              AI is load-bearing infrastructure.{" "}
              <span className="text-gradient-aurora">Not a bolt-on.</span>
            </h3>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Every interaction is a training signal. Every AI feature runs where it needs to —
              on-device for privacy, on-cluster for scale. No vendor lock-in on any model.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AI_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`rounded-xl border ${f.border} ${f.bg} p-4`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-md bg-surface-elevated border border-border grid place-items-center shrink-0">
                      <Icon className={`h-3.5 w-3.5 ${f.color}`} strokeWidth={1.75} />
                    </div>
                    <p
                      className={`text-[9px] font-mono-display uppercase tracking-widest ${f.color}`}
                    >
                      {f.sub}
                    </p>
                  </div>
                  <h4 className="text-sm font-bold mb-1.5">{f.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── § 10 Data Architecture ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-2">
              § 10 · Data Architecture
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Polyglot persistence.{" "}
              <span className="text-gradient-aurora">Right store for every problem.</span>
            </h3>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Six purpose-built databases, each chosen for a specific access pattern. Zero-copy
              analytics pipeline. Event-sourced. No single points of failure.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DATA_STORES.map((ds, i) => (
              <motion.div
                key={ds.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className={`rounded-xl border ${ds.border} bg-gradient-to-b ${ds.bg} p-5`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p
                      className={`text-[9px] font-mono-display uppercase tracking-widest ${ds.color} mb-0.5`}
                    >
                      {ds.badge}
                    </p>
                    <h4 className={`text-sm font-bold font-mono-display ${ds.color}`}>{ds.name}</h4>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono-display bg-surface px-2 py-0.5 rounded-full border border-border">
                    {ds.role}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {ds.uses.map((u) => (
                    <li
                      key={u}
                      className="flex items-center gap-2 text-[11px] text-muted-foreground"
                    >
                      <span
                        className={`h-1 w-1 rounded-full ${ds.color.replace("text-", "bg-")} shrink-0`}
                      />
                      {u}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── § 11 Infrastructure ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-2">
              § 11 · Infrastructure &amp; DevOps
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Multi-region active-active.{" "}
              <span className="text-gradient-aurora">GitOps. eBPF-native.</span>
            </h3>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INFRA_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="flex gap-4 p-5 rounded-xl border border-border bg-surface/40 hover:bg-surface transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-surface-elevated border border-border grid place-items-center shrink-0 mt-0.5">
                    <Icon className={`h-4 w-4 ${item.color}`} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold mb-1.5 ${item.color}`}>{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── § 12 Security ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-2">
              § 12 · Security Architecture
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Zero-trust. SLSA Level 3.{" "}
              <span className="text-gradient-aurora">DRM-hardened. E2E encrypted.</span>
            </h3>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECURITY_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="flex gap-4 p-5 rounded-xl border border-border bg-surface/40 hover:bg-surface transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-surface-elevated border border-border grid place-items-center shrink-0 mt-0.5">
                    <Icon className={`h-4 w-4 ${item.color}`} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold mb-1.5 ${item.color}`}>{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── § 13 Engineering Principles ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-2">
              § 13 · Engineering Principles
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Eight principles. <span className="text-gradient-aurora">Non-negotiable.</span>
            </h3>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              These are architectural constraints baked into NEXUS's engineering culture — not
              aspirational goals in a deck. They govern every PR, every deploy, every on-call
              escalation.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-4">
            {PRINCIPLES.map((p, i) => (
              <motion.div
                key={p.num}
                initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                className="flex gap-5 p-5 rounded-xl border border-border bg-surface/40"
              >
                <span className="text-2xl font-bold font-mono-display text-primary/30 shrink-0 leading-none mt-0.5">
                  {p.num}
                </span>
                <div>
                  <h4 className="text-sm font-bold mb-1.5">{p.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Final manifesto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-8 relative rounded-2xl overflow-hidden border border-primary/20 text-center p-10"
          >
            <div className="absolute inset-0 bg-aurora opacity-10" />
            <div className="absolute inset-0 scanlines" />
            <div className="relative">
              <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">
                NEXUS Architecture v4.0 · Closing Principle
              </p>
              <p className="text-2xl sm:text-3xl font-bold leading-snug max-w-3xl mx-auto">
                "Build the platform{" "}
                <span className="text-gradient-aurora">users can't imagine living without.</span>"
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Confidential — Internal Use Only · 2026 Edition
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
