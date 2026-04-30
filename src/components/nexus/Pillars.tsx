import { motion } from "framer-motion";
import {
  MessageSquare, ShoppingBag, Users, Film,
  Globe, Gamepad2, Boxes, Check,
} from "lucide-react";

const pillars = [
  {
    icon: MessageSquare,
    title: "Messaging & Chat",
    desc: "Signal Protocol (Double Ratchet + X3DH). Server is zero-knowledge. AI twin suggests replies in your voice. Group channels up to 100,000 members.",
    features: ["E2E encrypted · Signal Protocol", "AI-assisted replies", "WebRTC HD calls · spatial audio", "100K-member channels", "Per-message auto-delete"],
    section: "§02A",
    accent: "cyan",
  },
  {
    icon: ShoppingBag,
    title: "Commerce & Shopping",
    desc: "AI vision-based product search. In-app Stripe checkout with escrow. Seller dashboards with real-time analytics, low-stock alerts, and auto-reorder.",
    features: ["CLIP vision product search", "Escrow-protected payments", "Buy Now Pay Later", "Seller real-time dashboard", "Live shopping + add-to-cart"],
    section: "§02B",
    accent: "amber",
  },
  {
    icon: Users,
    title: "Social Experience",
    desc: "Intent-first, mood-aware feed. No rage-bait. Domain-specific reputation graph — influence in 'photography' is separate from 'code.' Earned, not bought.",
    features: ["Intent-first / mood-aware feed", "Forked & remixed content trees", "Domain reputation graph", "Creator monetisation tools", "Anonymous persona switching"],
    section: "§02C",
    accent: "violet",
  },
  {
    icon: Film,
    title: "Streaming & Cinema",
    desc: "AV1 primary codec — 40% bandwidth savings. Per-title ML bitrate ladders. 4K HDR · Dolby Atmos. VMAF ≥ 93 quality gate on every segment.",
    features: ["AV1 · SVT-AV1 codec", "Per-title ML bitrate ladder", "4K HDR · Dolby Atmos", "VMAF ≥ 93 quality gate", "Watch Together · synced parties"],
    section: "§07",
    accent: "pink",
  },
  {
    icon: Globe,
    title: "Web Browse & Sites",
    desc: "Chromium-based sandboxed browser. Tracker-blocking, fingerprint spoofing, cookie isolation. Publish your own site visible across NEXUS — drag-and-drop.",
    features: ["Privacy browser · tracker-blocking", "Fingerprint spoofing", "Drag-and-drop site builder", "Custom domain support", "Intent-aware — no context hijacking"],
    section: "§02D",
    accent: "emerald",
  },
  {
    icon: Gamepad2,
    title: "Gaming & Sports Hub",
    desc: "WebRTC cloud gaming at 60fps/1080p on 15Mbps+. In-app bracket creation, esports tournaments, fantasy leagues, party games from any chat thread.",
    features: ["WebRTC cloud gaming 60fps", "Esports bracket creation", "Fantasy leagues + live scores", "Party games from chat", "Rewarded opt-in ads for XP"],
    section: "§02E",
    accent: "amber",
  },
  {
    icon: Boxes,
    title: "NexOS App Ecosystem",
    desc: "Commission bespoke web/mobile apps built by the NEXUS team. Hosted in V8 isolate sandboxes. Connected to your identity and payments. A house with everything.",
    features: ["V8 isolate / Docker sandbox", "NEXUS SSO bridge", "OAuth 2.1 scoped API access", "appname.nexus.app routing", "20% platform fee · 80% to owner"],
    section: "§03",
    accent: "violet",
  },
];

const accentMap: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  cyan: { border: "group-hover:border-cyan-500/50", bg: "bg-cyan-500/10", text: "text-cyan-400", dot: "bg-cyan-400" },
  amber: { border: "group-hover:border-amber-500/50", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400" },
  violet: { border: "group-hover:border-violet-500/50", bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400" },
  pink: { border: "group-hover:border-pink-500/50", bg: "bg-pink-500/10", text: "text-pink-400", dot: "bg-pink-400" },
  emerald: { border: "group-hover:border-emerald-500/50", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
};

export function Pillars() {
  return (
    <section id="pillars" className="relative py-32 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-20"
        >
          <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">§ 02 · Super-App Vision</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            One app.{" "}
            <span className="text-gradient-aurora">Seven pillars.</span>{" "}
            <span className="text-muted-foreground">Every experience.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            NEXUS is not a feature aggregation. It's a living digital ecosystem where each pillar
            is a first-class, natively built experience — no external app dependencies.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            const a = accentMap[p.accent] ?? accentMap["cyan"];
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className={`pillar-card group flex flex-col`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`h-11 w-11 rounded-lg ${a.bg} border border-border grid place-items-center ${a.border} transition-colors`}>
                    <Icon className={`h-5 w-5 ${a.text}`} strokeWidth={1.75} />
                  </div>
                  <span className="font-mono-display text-xs text-muted-foreground/50">{p.section}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 tracking-tight">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{p.desc}</p>
                <ul className="space-y-1.5 border-t border-border pt-4 mt-auto">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className={`h-3 w-3 mt-0.5 shrink-0 ${a.text}`} strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}

          {/* Manifesto card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="md:col-span-2 lg:col-span-2 rounded-xl p-8 bg-aurora text-primary-foreground relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-background/10" />
            <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-mono-display uppercase tracking-widest opacity-80 mb-4">Core Manifesto</p>
              <p className="text-2xl sm:text-3xl font-semibold leading-snug">
                NEXUS never integrates third-party apps via APIs. Every experience is built natively or
                hosted inside the NexOS sandbox — one consistent, private environment.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["No Facebook SDK", "No Google Tags", "No third-party cookies", "Zero data brokers"].map((t) => (
                  <span key={t} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
