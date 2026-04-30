import { motion } from "framer-motion";
import {
  Smartphone, Cpu, Shield, Zap, Radio, Eye,
  Layers, Globe, Lock, BarChart3, Sparkles,
  Wifi, Database, GitBranch, Brain,
} from "lucide-react";

/* ── iOS Features ─────────────────────────────────────────────────────── */
const IOS_FEATURES = [
  {
    icon: Layers,
    title: "SwiftUI 5 + TCA",
    sub: "The Composable Architecture",
    desc: "Unidirectional state flow. Predictable, testable, zero side-effect leaks at scale.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
  },
  {
    icon: Zap,
    title: "Swift Concurrency",
    sub: "async/await + Actors",
    desc: "Safe parallelism. Data races eliminated at compile time. No more callback hell.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
  },
  {
    icon: Cpu,
    title: "Metal + RealityKit",
    sub: "GPU-accelerated · visionOS-ready",
    desc: "GPU-accelerated feed animations, AR filters, spatial content. Hardware-accelerated video decode.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/25",
  },
  {
    icon: Radio,
    title: "AVFoundation Pro",
    sub: "HLS · DASH · PiP · AirPlay 2",
    desc: "Adaptive playback engine. Dolby Atmos passthrough, offline download manager, Picture-in-Picture.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
  },
  {
    icon: Brain,
    title: "Core ML On-Device",
    sub: "Zero round-trip · Full privacy",
    desc: "Content embedding, nudge prediction, and moderation run locally. Data never leaves the device.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
  },
  {
    icon: Sparkles,
    title: "WidgetKit + Live Activities",
    sub: "Dynamic Island · Always-on",
    desc: "Feed snippets, live reaction counters, real-time story progress — system-level engagement hooks.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
  },
];

/* ── Android Features ─────────────────────────────────────────────────── */
const ANDROID_FEATURES = [
  {
    icon: Layers,
    title: "Jetpack Compose",
    sub: "Material You · 60fps guaranteed",
    desc: "Declarative UI with dynamic theming. Compose compiler metrics enforce 60fps at all times.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
  },
  {
    icon: Zap,
    title: "Kotlin 2.0 Coroutines + Flow",
    sub: "StateFlow · SharedFlow",
    desc: "Structured concurrency everywhere. StateFlow for UI, SharedFlow for events. Zero threading bugs.",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
  },
  {
    icon: Radio,
    title: "Media3 + ExoPlayer",
    sub: "DASH/HLS · HDR10+ · Dolby Vision",
    desc: "Google Media3 with adaptive streaming, DRM (Widevine L1), offline download, and HDR passthrough.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/25",
  },
  {
    icon: Globe,
    title: "KMP Shared Modules",
    sub: "iOS + Android · One source of truth",
    desc: "Kotlin Multiplatform shares domain logic, networking, and ML inference between both platforms.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    border: "border-pink-500/25",
  },
  {
    icon: Brain,
    title: "ML Kit + ONNX Runtime",
    sub: "On-device NLP · Image classification",
    desc: "Smart reply, nudge detection, and content moderation with zero cloud dependency.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/25",
  },
  {
    icon: Zap,
    title: "Baseline Profiles",
    sub: "Cold start <400ms · First-frame <300ms",
    desc: "Pre-compiled critical code paths. App startup and video first-frame exceed industry benchmarks.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
  },
];

/* ── Shared KPIs ──────────────────────────────────────────────────────── */
const MOBILE_KPIS = [
  { value: "<400ms", label: "Cold start · Android", sub: "Baseline Profiles" },
  { value: "<300ms", label: "First-frame · both", sub: "Hardware decode" },
  { value: "60fps", label: "Feed animations", sub: "Compose + Metal" },
  { value: "L1 DRM", label: "Widevine · FairPlay", sub: "4K HDR protected" },
  { value: "On-device", label: "ML inference", sub: "Core ML · ONNX" },
  { value: "visionOS", label: "Spatial ready", sub: "RealityKit · Metal" },
];

/* ── Cross-platform shared stack ──────────────────────────────────────── */
const SHARED_STACK = [
  { label: "KMP domain logic", desc: "Business rules shared iOS ↔ Android" },
  { label: "KMP networking layer", desc: "Single HTTP client, one source of truth" },
  { label: "KMP ML inference", desc: "ONNX models run natively on both platforms" },
  { label: "KMP crypto primitives", desc: "Signal Protocol keys generated identically" },
];

export function MobileSection() {
  return (
    <section id="mobile" className="relative py-32 px-6 border-t border-border overflow-hidden">
      {/* Background */}
      <div className="pointer-events-none absolute left-0 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan-500/6 blur-3xl -z-10" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-violet-500/6 blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl space-y-24">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">§ 06 · Mobile — iOS &amp; Android</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            Native performance.{" "}
            <span className="text-gradient-aurora">On-device AI. Cinema-grade.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
            NEXUS is not a cross-platform React Native app. Both iOS and Android are fully native —
            Swift 6 + SwiftUI 5 on Apple, Kotlin 2.0 + Jetpack Compose on Android.
            Business logic is shared via Kotlin Multiplatform. Zero compromise on either platform.
          </p>
        </motion.div>

        {/* ── KPI strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border rounded-2xl overflow-hidden border border-border"
        >
          {MOBILE_KPIS.map((k) => (
            <div key={k.label} className="bg-surface p-5 text-center">
              <div className="text-2xl font-bold text-gradient-aurora">{k.value}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">{k.label}</div>
              <div className="mt-1 text-[9px] font-mono-display text-primary/70">{k.sub}</div>
            </div>
          ))}
        </motion.div>

        {/* ── iOS + Android side by side ── */}
        <div className="grid lg:grid-cols-2 gap-12">

          {/* iOS */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 grid place-items-center">
                <Smartphone className="h-5 w-5 text-white" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">iOS — Swift 6 + SwiftUI 5</h3>
                <p className="text-xs font-mono-display text-primary">visionOS-ready · TCA architecture</p>
              </div>
            </div>
            <div className="space-y-3">
              {IOS_FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className={`flex gap-4 p-4 rounded-xl border ${f.border} ${f.bg}`}
                  >
                    <div className={`h-9 w-9 rounded-lg bg-surface-elevated border border-border grid place-items-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${f.color}`} strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-sm font-bold">{f.title}</span>
                        <span className={`text-[10px] font-mono-display ${f.color}`}>{f.sub}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Android */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 grid place-items-center">
                <Smartphone className="h-5 w-5 text-white" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">Android — Kotlin 2.0 + Compose</h3>
                <p className="text-xs font-mono-display text-emerald-400">Baseline Profiles · Media3 · ExoPlayer</p>
              </div>
            </div>
            <div className="space-y-3">
              {ANDROID_FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className={`flex gap-4 p-4 rounded-xl border ${f.border} ${f.bg}`}
                  >
                    <div className={`h-9 w-9 rounded-lg bg-surface-elevated border border-border grid place-items-center shrink-0`}>
                      <Icon className={`h-4 w-4 ${f.color}`} strokeWidth={1.75} />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="text-sm font-bold">{f.title}</span>
                        <span className={`text-[10px] font-mono-display ${f.color}`}>{f.sub}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* ── KMP shared modules ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl border border-border bg-surface/40 p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-8">
            <div className="flex-1">
              <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-2">Kotlin Multiplatform · Shared Layer</p>
              <h3 className="text-2xl font-bold tracking-tight">
                One source of truth.{" "}
                <span className="text-gradient-aurora">Two native apps.</span>
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Business logic, networking, ML inference, and crypto primitives are written once in KMP
                and compiled natively to both Swift and JVM. Zero performance overhead, zero drift between platforms.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-center">
                <p className="text-xs font-mono-display text-cyan-400 font-bold">iOS</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Swift 6</p>
              </div>
              <div className="text-muted-foreground text-sm font-mono-display">←KMP→</div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center">
                <p className="text-xs font-mono-display text-emerald-400 font-bold">Android</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Kotlin 2.0</p>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SHARED_STACK.map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-surface-elevated p-3">
                <div className="flex items-center gap-2 mb-1">
                  <GitBranch className="h-3 w-3 text-primary shrink-0" strokeWidth={1.75} />
                  <span className="text-xs font-semibold">{s.label}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── DRM + offline ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid sm:grid-cols-3 gap-4"
        >
          {[
            {
              icon: Shield,
              title: "Multi-DRM Stack",
              desc: "Widevine (Android/Chrome) · FairPlay (Apple) · PlayReady (Windows/Xbox). Single CENC encryption, multiple license servers.",
              color: "text-emerald-400",
              border: "border-emerald-500/20",
              bg: "bg-emerald-500/8",
            },
            {
              icon: Lock,
              title: "Hardware Security L1",
              desc: "Widevine L1 (TEE-backed) required for 4K/HDR. L3 for 1080p. Hardware DRM coverage: 85%+ of active devices.",
              color: "text-cyan-400",
              border: "border-cyan-500/20",
              bg: "bg-cyan-500/8",
            },
            {
              icon: Database,
              title: "Secure Offline Downloads",
              desc: "License-bound decryption enforces expiry. Downloaded content encrypted with device-bound key. 25 titles on Premium.",
              color: "text-violet-400",
              border: "border-violet-500/20",
              bg: "bg-violet-500/8",
            },
          ].map(({ icon: Icon, title, desc, color, border, bg }) => (
            <div key={title} className={`rounded-xl border ${border} ${bg} p-5`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-surface-elevated border border-border grid place-items-center shrink-0">
                  <Icon className={`h-4 w-4 ${color}`} strokeWidth={1.75} />
                </div>
                <h4 className={`text-sm font-bold ${color}`}>{title}</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
