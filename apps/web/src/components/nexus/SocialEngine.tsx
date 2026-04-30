import { motion } from "framer-motion";
import {
  GitBranch,
  Sparkles,
  Radio,
  Users,
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  Star,
  Coins,
  Eye,
  Heart,
  Zap,
  BarChart3,
  Lock,
} from "lucide-react";

/* ── Intent modes ─────────────────────────────────────────────────────── */
const INTENT_MODES = [
  {
    emoji: "🔬",
    label: "Learn",
    desc: "Surfaces long-form tutorials, research, courses, and explainers.",
    ad: "Camera lens — 'Photography MasterClass'",
  },
  {
    emoji: "🌊",
    label: "Chill",
    desc: "Lo-fi music, nature videos, ambient content, creative art.",
    ad: "Cozy café — 'Weekend Reading'",
  },
  {
    emoji: "🌍",
    label: "Explore",
    desc: "Travel stories, culture docs, adventure reels, local discovery.",
    ad: "Flights — 'Direct to Nairobi from €189'",
  },
  {
    emoji: "🎨",
    label: "Create",
    desc: "Design inspo, making-of content, creative tools, gear reviews.",
    ad: "Wacom tablet — 'Creator Bundle'",
  },
  {
    emoji: "💰",
    label: "Shop",
    desc: "Product reviews, unboxings, fashion looks, live shopping drops.",
    ad: "Camera bag — '40% off today only'",
  },
];

/* ── Social features ─────────────────────────────────────────────────── */
const SOCIAL_FEATURES = [
  {
    icon: GitBranch,
    title: "Forked Content Trees",
    section: "§02C",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
    desc: "Any post can be forked, remixed, and evolved. Full provenance tracked in ClickHouse — a Git-style immutable content graph. No content theft, no erasure of credit.",
    detail: [
      "Full version history",
      "Original author always credited",
      "Remix attribution chain",
      "ClickHouse provenance log",
    ],
  },
  {
    icon: Radio,
    title: "AI Identity Twin",
    section: "§09",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
    desc: "Every user gets an AI twin fine-tuned on their post history. It drafts replies in their voice, summarises threads, acts as an autonomous agent when offline.",
    detail: [
      "Writes in your style",
      "Summarises long threads",
      "Autonomous agent mode",
      "On-device fine-tuning",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Reputation Graph",
    section: "§08",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    desc: "Domain-specific trust scores replace vanity metrics. Influence in 'photography' is separate from 'coding.' Earned through quality posts, not bought through ads. Powered by Neo4j AuraDB.",
    detail: [
      "Domain-isolated scores",
      "Neo4j AuraDB graph",
      "Sybil-resistant design",
      "Cannot be purchased",
    ],
  },
  {
    icon: Coins,
    title: "Creator Monetisation",
    section: "§06",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    desc: "80% revenue share — the highest in the industry. Tipping, subscriptions, live merchandise, branded content labelling, and opt-in rewarded ads that pay you directly.",
    detail: [
      "80% rev share",
      "Tipping + subscriptions",
      "Live shopping drops",
      "Intent-matched brand deals",
    ],
  },
  {
    icon: Lock,
    title: "Anonymous Personas",
    section: "§04",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/25",
    desc: "Switch between personas with zero cross-contamination. Each persona has its own feed, DMs, and reputation. Cryptographically unlinkable — not just a UI toggle.",
    detail: [
      "Cryptographically separate",
      "Own feed + reputation",
      "Zero linkability",
      "Signal-grade isolation",
    ],
  },
  {
    icon: GitBranch,
    title: "Community Spaces",
    section: "§02F",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
    desc: "Topic-scoped communities governed by elected moderators. ThreadQ surfaces highest-quality replies first. Long-form 'knowledge threads' automatically become structured wikis.",
    detail: [
      "Elected mod governance",
      "ThreadQ quality ranking",
      "Auto-wiki from threads",
      "100K member channels",
    ],
  },
];

/* ── Feed algorithm transparency ─────────────────────────────────────── */
const ALGO_STEPS = [
  {
    step: "01",
    label: "Declare intent",
    desc: "User sets mood (learn / chill / explore / create / shop). Persists per session.",
    color: "text-cyan-400",
  },
  {
    step: "02",
    label: "Thompson Sampling",
    desc: "Exploration vs exploitation. Fresh creators always get minimum guaranteed impressions.",
    color: "text-violet-400",
  },
  {
    step: "03",
    label: "Qdrant scoring",
    desc: "512-dim content embeddings matched to user interest model. Sub-5ms ranking.",
    color: "text-pink-400",
  },
  {
    step: "04",
    label: "Intent guard",
    desc: "Content classified against declared intent. Off-intent items removed regardless of engagement prediction.",
    color: "text-amber-400",
  },
  {
    step: "05",
    label: "Quality filter",
    desc: "Reputation graph weight applied. Low-reputation sources capped. Viral bait algorithmically penalised.",
    color: "text-emerald-400",
  },
  {
    step: "06",
    label: "Serve + measure",
    desc: "Dwell, replays, skips, and shares update Kafka → Flink → feature store in real time.",
    color: "text-cyan-400",
  },
];

/* ── Creator revenue comparison ──────────────────────────────────────── */
const REV_COMPARE = [
  { platform: "NEXUS", share: 80, note: "Highest in industry", highlight: true },
  { platform: "YouTube", share: 55, note: "AdSense + memberships", highlight: false },
  { platform: "Twitch", share: 50, note: "Subscriptions only", highlight: false },
  { platform: "TikTok", share: 5, note: "Creator Fund", highlight: false },
  { platform: "Instagram", share: 0, note: "No direct rev share", highlight: false },
  { platform: "X / Twitter", share: 0, note: "Verified only / US", highlight: false },
];

export function SocialEngine() {
  return (
    <section id="social" className="relative py-32 px-6 border-t border-border overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute right-0 top-0 h-[700px] w-[700px] rounded-full bg-violet-500/6 blur-3xl -z-10" />

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
            § 02C · Social Engine
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            Social media, <span className="text-gradient-aurora">rebuilt with integrity.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Intent-first feeds. Earned reputation, not bought. Forked content trees with full
            provenance. 80% creator revenue share. An AI twin that writes in your voice. This is
            what social media was supposed to be.
          </p>
        </motion.div>

        {/* ── Intent-First Feed ── */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">
              § Intent-First Feed
            </p>
            <h3 className="text-3xl font-bold tracking-tight mb-4">
              You choose what you see. <span className="text-gradient-aurora">Always.</span>
            </h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Users declare their mood at the start of each session. The algorithm serves
              exclusively matching content. If you're in 'learn' mode, zero rage-bait, zero shopping
              ads — only educational content with an ad matched to your declared intent.
            </p>
            <div className="space-y-3">
              {INTENT_MODES.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="group flex gap-4 p-4 rounded-xl border border-border bg-surface/40 hover:bg-surface transition-colors"
                >
                  <span className="text-2xl shrink-0">{m.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold">{m.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{m.desc}</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-display text-primary">
                      <Zap className="h-2.5 w-2.5" />
                      Intent-matched ad: {m.ad}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Algorithm transparency */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">
              § Algorithm Transparency
            </p>
            <h3 className="text-3xl font-bold tracking-tight mb-4">
              The full feed pipeline. <span className="text-gradient-aurora">No black boxes.</span>
            </h3>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              NEXUS publishes its full ranking algorithm. Every signal, every weight. Users can
              audit exactly why any piece of content appeared in their feed.
            </p>
            <div className="space-y-2.5">
              {ALGO_STEPS.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="flex gap-4 p-4 rounded-xl border border-border bg-surface/40"
                >
                  <span
                    className={`text-xs font-mono-display font-bold ${s.color} shrink-0 mt-0.5`}
                  >
                    {s.step}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${s.color} mb-0.5`}>{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Social Feature Cards ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-2">
              § Social Features
            </p>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Six features that change{" "}
              <span className="text-gradient-aurora">everything about social.</span>
            </h3>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SOCIAL_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07 }}
                  className={`rounded-xl border ${f.border} ${f.bg} p-5 hover:scale-[1.01] transition-transform`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`h-10 w-10 rounded-lg bg-surface-elevated border border-border grid place-items-center`}
                    >
                      <Icon className={`h-4 w-4 ${f.color}`} strokeWidth={1.75} />
                    </div>
                    <span className="text-[9px] font-mono-display text-muted-foreground/50">
                      {f.section}
                    </span>
                  </div>
                  <h4 className="text-base font-bold mb-2">{f.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{f.desc}</p>
                  <ul className="space-y-1">
                    {f.detail.map((d) => (
                      <li
                        key={d}
                        className="flex items-center gap-2 text-[11px] text-muted-foreground"
                      >
                        <span
                          className={`h-1 w-1 rounded-full ${f.color.replace("text-", "bg-")} shrink-0`}
                        />
                        {d}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── Creator Revenue Share ── */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          >
            <div>
              <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-2">
                § 06 · Creator Economy
              </p>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                80% to creators. <span className="text-gradient-aurora">Industry leading.</span>
              </h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Because creators are the product — they deserve the majority of what they generate.
            </p>
          </motion.div>

          <div className="space-y-2.5">
            {REV_COMPARE.map((r, i) => (
              <motion.div
                key={r.platform}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`flex items-center gap-4 rounded-xl p-4 ${r.highlight ? "nexus-row bg-cyan-500/5" : "border border-border bg-surface/30"}`}
              >
                <div
                  className={`w-32 shrink-0 text-sm font-semibold ${r.highlight ? "text-cyan-300" : "text-foreground"}`}
                >
                  {r.platform}
                </div>
                <div className="flex-1">
                  <div className="h-3 rounded-full bg-border overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${r.share}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full rounded-full ${r.highlight ? "bg-gradient-to-r from-cyan-400 to-violet-500" : "bg-muted-foreground/30"}`}
                    />
                  </div>
                </div>
                <div
                  className={`w-16 text-right font-bold font-mono-display text-sm ${r.highlight ? "text-cyan-300" : "text-muted-foreground"}`}
                >
                  {r.share}%
                </div>
                <div className="w-40 text-right text-xs text-muted-foreground hidden sm:block">
                  {r.note}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Anti-patterns we eliminate ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-border bg-surface/40 p-8 sm:p-12"
        >
          <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">
            § Anti-Pattern Elimination
          </p>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">
            What NEXUS <span className="text-gradient-aurora">will never do.</span>
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Engagement bait / rage-bait amplification", icon: TrendingUp },
              { label: "Vanity metric-based ranking (likes as currency)", icon: Heart },
              { label: "Algorithmic context hijacking mid-session", icon: Eye },
              { label: "Third-party ad network data sharing", icon: BarChart3 },
              { label: "Shadow-banning without transparent reason", icon: Lock },
              { label: "Bought verification / bought influence", icon: Star },
              { label: "Auto-playing unrelated content", icon: Sparkles },
              { label: "Content theft without provenance tracking", icon: GitBranch },
              { label: "Infinite scroll with no session boundary", icon: Users },
            ].map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-start gap-3 rounded-lg border border-destructive/15 bg-destructive/5 p-3"
              >
                <div className="h-6 w-6 rounded-md bg-destructive/10 grid place-items-center shrink-0 mt-0.5">
                  <Icon className="h-3 w-3 text-destructive" strokeWidth={1.75} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              These aren't aspirational goals — they're{" "}
              <span className="text-foreground font-semibold">architectural constraints</span> baked
              into the ranking system, ad pipeline, and feed API. They cannot be overridden by
              business pressure.
            </p>
          </div>
        </motion.div>

        {/* ── Messaging ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <div>
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">
              § 02A · Messaging
            </p>
            <h3 className="text-3xl font-bold tracking-tight mb-4">
              Signal-grade encryption. <span className="text-gradient-aurora">Built in.</span>
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Every DM, group chat, and call uses the Signal Protocol — Double Ratchet and X3DH. The
              server is zero-knowledge. Even NEXUS cannot read your messages. AI-assisted replies
              are processed entirely on-device.
            </p>
            <div className="space-y-2">
              {[
                { label: "Signal Protocol · Double Ratchet + X3DH", color: "text-cyan-400" },
                {
                  label: "Server zero-knowledge — NEXUS cannot read your DMs",
                  color: "text-emerald-400",
                },
                { label: "WebRTC HD calls with spatial audio", color: "text-violet-400" },
                { label: "100,000-member encrypted group channels", color: "text-amber-400" },
                { label: "Per-message disappearing mode", color: "text-pink-400" },
                {
                  label: "On-device AI reply suggestions — never uploaded",
                  color: "text-cyan-400",
                },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-start gap-2.5 text-sm">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${color.replace("text-", "bg-")} mt-1.5 shrink-0`}
                  />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mock chat UI */}
          <div className="relative">
            <div className="absolute inset-0 bg-aurora rounded-2xl blur-3xl opacity-15 animate-float-slow" />
            <div className="relative rounded-2xl border border-border bg-surface/60 backdrop-blur-xl overflow-hidden shadow-card-elevated">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className="h-9 w-9 rounded-full bg-aurora grid place-items-center text-xs font-bold text-primary-foreground">
                  A
                </div>
                <div>
                  <p className="text-sm font-semibold">alex_nexus</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <Lock className="h-2.5 w-2.5" />
                    E2E encrypted · Signal Protocol
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-glow" />
                  <span className="text-[10px] text-muted-foreground">online</span>
                </div>
              </div>
              {/* Messages */}
              <div className="px-5 py-4 space-y-3 min-h-[200px]">
                {[
                  {
                    from: "other",
                    text: "Just saw your post about the new Fuji lens 👀",
                    time: "14:21",
                  },
                  {
                    from: "self",
                    text: "Yeah! Shot a whole session with it yesterday. Share the edit soon.",
                    time: "14:22",
                  },
                  {
                    from: "other",
                    text: "Drop it in the Photography space — your rep there is insane 📸",
                    time: "14:22",
                  },
                  {
                    from: "self",
                    text: "Will do. Also forked your composition thread — added some notes.",
                    time: "14:24",
                  },
                ].map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.from === "self" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-xl px-3.5 py-2 text-xs ${
                        msg.from === "self"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-surface-elevated border border-border text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                      <span
                        className={`ml-2 text-[9px] ${msg.from === "self" ? "text-primary-foreground/60" : "text-muted-foreground"}`}
                      >
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {/* AI suggestion */}
              <div className="border-t border-border px-5 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3 w-3 text-violet-400" />
                  <span className="text-[10px] font-mono-display text-violet-400 uppercase tracking-widest">
                    AI Twin suggests (on-device)
                  </span>
                </div>
                <div className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2 text-xs text-muted-foreground">
                  "Here's a peek — gear review drops Monday with the full edit 🙌"
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
