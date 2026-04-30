import { motion } from "framer-motion";
import {
  Zap,
  Film,
  Cpu,
  BarChart3,
  Shield,
  Globe,
  Wifi,
  ChevronRight,
  Check,
  X,
  Minus,
  Activity,
  Clock,
  Server,
  Database,
  Eye,
  Lock,
} from "lucide-react";

/* ── Pipeline stages ─────────────────────────────────────────────────── */
const PIPELINE = [
  {
    step: "01",
    label: "Ingest",
    tech: "Kafka · S3",
    desc: "Upload lands in multi-region object store. Kafka event fires immediately.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
  {
    step: "02",
    label: "Analyse",
    tech: "FFprobe · VMAF",
    desc: "Scene complexity scored. VMAF baseline measured. Per-title ML ladder selected.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
  },
  {
    step: "03",
    label: "Transcode",
    tech: "SVT-AV1 · A100",
    desc: "GPU cluster scales from zero via KEDA. 4K film done in <8 min. VMAF ≥ 93 gate.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
  },
  {
    step: "04",
    label: "Package",
    tech: "CMAF · DASH",
    desc: "2-second segments. CTE-enabled. Low-latency live profile for streams.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  {
    step: "05",
    label: "Protect",
    tech: "Widevine L1",
    desc: "TEE-backed hardware DRM. Forensic watermark ties every stream to account.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  {
    step: "06",
    label: "Deliver",
    tech: "Anycast CDN",
    desc: "Global edge PoPs. ABR switches in <200ms. <300ms first-frame on any device.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
];

/* ── Competitor comparison table ─────────────────────────────────────── */
type CellValue = true | false | string | null;

interface CompetitorRow {
  feature: string;
  nexus: CellValue;
  tiktok: CellValue;
  netflix: CellValue;
  instagram: CellValue;
  youtube: CellValue;
}

const COMPARE: CompetitorRow[] = [
  {
    feature: "Primary video codec",
    nexus: "AV1",
    tiktok: "H.264/H.265",
    netflix: "AV1 (TV only)",
    instagram: "H.264",
    youtube: "AV1 (partial)",
  },
  {
    feature: "First-frame latency",
    nexus: "<300ms",
    tiktok: "~600ms",
    netflix: "~800ms",
    instagram: "~700ms",
    youtube: "~500ms",
  },
  {
    feature: "4K HDR + Dolby Atmos",
    nexus: true,
    tiktok: false,
    netflix: true,
    instagram: false,
    youtube: "4K only",
  },
  {
    feature: "VMAF quality gate",
    nexus: "≥ 93",
    tiktok: false,
    netflix: "partial",
    instagram: false,
    youtube: false,
  },
  {
    feature: "Per-title ML bitrate",
    nexus: true,
    tiktok: false,
    netflix: true,
    instagram: false,
    youtube: false,
  },
  {
    feature: "Intent-first feed",
    nexus: true,
    tiktok: false,
    netflix: false,
    instagram: false,
    youtube: false,
  },
  {
    feature: "Signal-protocol E2E chat",
    nexus: true,
    tiktok: false,
    netflix: false,
    instagram: "partial",
    youtube: false,
  },
  {
    feature: "Zero third-party cookies",
    nexus: true,
    tiktok: false,
    netflix: false,
    instagram: false,
    youtube: false,
  },
  {
    feature: "Watch Together (synced)",
    nexus: true,
    tiktok: false,
    netflix: "ext app",
    instagram: false,
    youtube: false,
  },
  {
    feature: "In-app commerce + escrow",
    nexus: true,
    tiktok: "partial",
    netflix: false,
    instagram: "partial",
    youtube: false,
  },
  {
    feature: "Offline downloads",
    nexus: "25 titles",
    tiktok: false,
    netflix: true,
    instagram: false,
    youtube: "Premium",
  },
  {
    feature: "Ad-free tier",
    nexus: "€19.99/mo",
    tiktok: false,
    netflix: "€15.99",
    instagram: false,
    youtube: "€13.99",
  },
  {
    feature: "On-device ML inference",
    nexus: true,
    tiktok: false,
    netflix: false,
    instagram: false,
    youtube: false,
  },
  {
    feature: "Creator rev share",
    nexus: "80%",
    tiktok: "< 5%",
    netflix: "N/A",
    instagram: "varies",
    youtube: "55%",
  },
];

/* ── QoE Metrics (live-style display) ────────────────────────────────── */
const QOE_METRICS = [
  { label: "P50 first-frame", value: "148ms", delta: "−63%", vs: "vs TikTok", good: true },
  { label: "P95 first-frame", value: "289ms", delta: "−51%", vs: "vs YouTube", good: true },
  { label: "Rebuffer ratio", value: "0.04%", delta: "−92%", vs: "vs Netflix", good: true },
  { label: "Avg VMAF score", value: "95.2", delta: "+7.4", vs: "vs H.264", good: true },
  { label: "Bandwidth saved", value: "41%", delta: "AV1", vs: "vs H.264", good: true },
  { label: "4K transcode time", value: "<8 min", delta: "A100", vs: "GPU cluster", good: true },
];

/* ── Tech highlights ticker ──────────────────────────────────────────── */
const TICKER_ITEMS = [
  "AV1 · SVT-AV1 Codec",
  "ScyllaDB 1M+ writes/sec",
  "ClickHouse 100× faster analytics",
  "Qdrant Vector Search · 1B items",
  "KEDA GPU Autoscaling",
  "Widevine L1 TEE DRM",
  "Forensic Watermarking <30s",
  "Cilium eBPF Networking",
  "Kafka → Flink Feature Pipeline",
  "Multi-Region Active-Active",
  "Signal Protocol E2E",
  "Neo4j AuraDB Social Graph",
  "VMAF ≥ 93 Quality Gate",
  "CMAF Low-Latency Live",
  "Anycast Global CDN",
  "mTLS Zero-Trust Mesh",
];

function CellDisplay({ val, isNexus }: { val: CellValue; isNexus?: boolean }) {
  if (val === true)
    return (
      <Check
        className={`h-4 w-4 mx-auto ${isNexus ? "text-cyan-400" : "text-emerald-500"}`}
        strokeWidth={2.5}
      />
    );
  if (val === false) return <X className="h-4 w-4 mx-auto text-red-400/60" strokeWidth={2} />;
  if (val === null) return <Minus className="h-4 w-4 mx-auto text-muted-foreground/30" />;
  return (
    <span
      className={`text-xs font-mono-display ${isNexus ? "text-cyan-300 font-bold" : "text-muted-foreground"}`}
    >
      {val}
    </span>
  );
}

export function StreamingShowcase() {
  return (
    <section id="streaming" className="relative py-32 px-6 border-t border-border overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 dot-grid-bg opacity-30 -z-10" />
      <div className="pointer-events-none absolute left-0 top-1/4 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-3xl -z-10" />
      <div className="pointer-events-none absolute right-0 bottom-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/8 blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl space-y-28">
        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">
            § 07 · Streaming Engine
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            Faster than TikTok. <span className="text-gradient-aurora">Sharper than Netflix.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
            NEXUS's streaming engine was designed from first principles — AV1 primary codec,
            per-title ML bitrate ladders, VMAF quality gates, and a global anycast CDN that delivers
            the first frame in under 300ms, cold.
          </p>
        </motion.div>

        {/* ── Tech Ticker ── */}
        <div className="relative overflow-hidden py-4 border-y border-border">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="ticker-track animate-ticker">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span
                key={i}
                className="shrink-0 inline-flex items-center gap-2 text-xs font-mono-display uppercase tracking-widest text-muted-foreground"
              >
                <span className="h-1 w-1 rounded-full bg-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ── Video pipeline ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-2">
              § 07A · Upload → Playback Pipeline
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Six stages. End-to-end. <span className="text-gradient-aurora">Zero compromise.</span>
            </h3>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PIPELINE.map((stage, i) => (
              <motion.div
                key={stage.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className={`relative rounded-xl border ${stage.border} ${stage.bg} p-4 group hover:scale-[1.02] transition-transform`}
              >
                {/* Arrow connector (all except last) */}
                {i < PIPELINE.length - 1 && (
                  <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                )}
                <div
                  className={`text-[10px] font-mono-display font-bold uppercase tracking-widest ${stage.color} mb-2`}
                >
                  {stage.step}
                </div>
                <div className="text-sm font-bold mb-0.5">{stage.label}</div>
                <div className={`text-[10px] font-mono-display ${stage.color} mb-2`}>
                  {stage.tech}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{stage.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Pipeline result callout */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-4 py-5 rounded-xl border border-border bg-surface/40"
          >
            {[
              { icon: Clock, label: "<300ms first-frame", color: "text-cyan-400" },
              { icon: Film, label: "VMAF ≥ 93 every segment", color: "text-violet-400" },
              { icon: Cpu, label: "<8min 4K transcode", color: "text-pink-400" },
              { icon: Shield, label: "Widevine L1 DRM", color: "text-emerald-400" },
              { icon: Globe, label: "Global Anycast CDN", color: "text-amber-400" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color}`} strokeWidth={1.75} />
                <span className={`text-xs font-mono-display font-bold ${color}`}>{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── QoE Metrics ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-2">
              § 07B · Live QoE Metrics
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Every metric{" "}
              <span className="text-gradient-aurora">measured. Every deploy gated.</span>
            </h3>
            <p className="mt-3 text-muted-foreground max-w-xl">
              ClickHouse aggregates quality-of-experience data in real time per CDN PoP. A deploy
              that degrades P95 first-frame by more than 5% is automatically rolled back.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {QOE_METRICS.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-xl border border-border bg-surface/40 p-4 text-center hover:bg-surface transition-colors"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Activity className="h-3 w-3 text-emerald-400" />
                  <span className="text-[9px] font-mono-display text-emerald-400 uppercase tracking-widest">
                    Live
                  </span>
                </div>
                <div className="text-2xl font-bold text-gradient-aurora">{m.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{m.label}</div>
                <div className="mt-2 text-[10px] font-mono-display text-emerald-400">
                  {m.delta} {m.vs}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Competitor Table ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-2">
              § 07C · Platform Comparison
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              NEXUS vs the incumbents.{" "}
              <span className="text-gradient-aurora">Feature by feature.</span>
            </h3>
            <p className="mt-3 text-muted-foreground max-w-xl">
              No cherry-picking. A full engineering and product comparison against TikTok, Netflix,
              Instagram, and YouTube — on the metrics that actually matter to users.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-border bg-surface/40 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="spec-table w-full min-w-[700px]">
                <thead>
                  <tr>
                    <th className="text-left">Feature</th>
                    <th className="nexus-row text-center bg-cyan-500/5">NEXUS ✦</th>
                    <th className="text-center">TikTok</th>
                    <th className="text-center">Netflix</th>
                    <th className="text-center">Instagram</th>
                    <th className="text-center">YouTube</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map((row, i) => (
                    <motion.tr
                      key={row.feature}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.03 }}
                      className="hover:bg-surface transition-colors"
                    >
                      <td className="text-sm font-medium text-foreground/80">{row.feature}</td>
                      <td className="nexus-row text-center bg-cyan-500/5">
                        <CellDisplay val={row.nexus} isNexus />
                      </td>
                      <td className="text-center">
                        <CellDisplay val={row.tiktok} />
                      </td>
                      <td className="text-center">
                        <CellDisplay val={row.netflix} />
                      </td>
                      <td className="text-center">
                        <CellDisplay val={row.instagram} />
                      </td>
                      <td className="text-center">
                        <CellDisplay val={row.youtube} />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border px-6 py-3 flex items-center gap-2 text-[10px] text-muted-foreground font-mono-display">
              <span className="h-1 w-1 rounded-full bg-primary" />
              NEXUS Architecture Blueprint v4.0 · Data from public engineering disclosures · 2026
            </div>
          </motion.div>
        </div>

        {/* ── Architecture stack summary ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {[
            {
              icon: Database,
              title: "ScyllaDB + Cassandra 5",
              detail:
                "1M+ writes/sec. Feed events, view telemetry, interaction logs. CQL-compatible. Zero compromise on write throughput.",
              tag: "§ Data Layer",
              color: "text-cyan-400",
              border: "border-cyan-500/20",
            },
            {
              icon: Server,
              title: "ClickHouse Analytics",
              detail:
                "100× faster than PostgreSQL. Real-time A/B metrics. Per-PoP QoE aggregation. Funnel analysis at 1-second granularity.",
              tag: "§ Analytics",
              color: "text-amber-400",
              border: "border-amber-500/20",
            },
            {
              icon: Eye,
              title: "Qdrant + Neo4j",
              detail:
                "512-dim AV embeddings for semantic search. Neo4j AuraDB social graph. Sub-5ms retrieval at 1 billion items.",
              tag: "§ AI / Graph",
              color: "text-violet-400",
              border: "border-violet-500/20",
            },
            {
              icon: Lock,
              title: "Zero-Trust Security",
              detail:
                "mTLS between all services. Widevine L1 TEE. HashiCorp Vault secrets. Forensic watermark traces leaks to account in 30s.",
              tag: "§ Security",
              color: "text-emerald-400",
              border: "border-emerald-500/20",
            },
          ].map(({ icon: Icon, title, detail, tag, color, border }) => (
            <div
              key={title}
              className={`rounded-xl border ${border} bg-surface/40 p-5 hover:bg-surface transition-colors`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-surface-elevated border border-border grid place-items-center shrink-0">
                  <Icon className={`h-4 w-4 ${color}`} strokeWidth={1.75} />
                </div>
                <div>
                  <p
                    className={`text-[9px] font-mono-display uppercase tracking-widest ${color} mb-0.5`}
                  >
                    {tag}
                  </p>
                  <h4 className="text-sm font-bold leading-tight">{title}</h4>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{detail}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Manifesto banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden border border-primary/20"
        >
          <div className="absolute inset-0 bg-aurora opacity-10" />
          <div className="absolute inset-0 scanlines" />
          <div className="relative px-8 py-10 sm:px-14 sm:py-14 flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-3">
                § 13 · Streaming Principle
              </p>
              <blockquote className="text-2xl sm:text-3xl font-semibold leading-snug">
                "Video is a first-class primitive.{" "}
                <span className="text-gradient-aurora">QoE metrics gate every deploy.</span> A
                single rebuffer is a bug."
              </blockquote>
              <p className="mt-4 text-sm text-muted-foreground">
                NEXUS Streaming Engineering Charter · v4.0
              </p>
            </div>
            <div className="shrink-0 flex flex-col gap-2 text-center">
              {[
                { val: "<300ms", sub: "cold start" },
                { val: "VMAF 93+", sub: "quality floor" },
                { val: "AV1", sub: "primary codec" },
              ].map(({ val, sub }) => (
                <div key={val} className="rounded-lg border border-border bg-surface/60 px-6 py-3">
                  <div className="text-2xl font-bold text-gradient-aurora">{val}</div>
                  <div className="text-[10px] font-mono-display uppercase tracking-widest text-muted-foreground">
                    {sub}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
