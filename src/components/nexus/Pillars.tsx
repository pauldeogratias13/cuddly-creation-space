import { motion } from "framer-motion";
import {
  MessageSquare,
  ShoppingBag,
  Users,
  Film,
  Globe,
  Gamepad2,
  Boxes,
} from "lucide-react";

const pillars = [
  {
    icon: MessageSquare,
    title: "Messaging & Chat",
    desc: "Signal-protocol E2E encryption, AI-assisted replies, voice & video calls with spatial audio. Zero-knowledge by default.",
  },
  {
    icon: ShoppingBag,
    title: "Commerce & Shopping",
    desc: "Native storefronts, AI product discovery, in-app checkout with escrow, seller dashboards, and tracked delivery.",
  },
  {
    icon: Users,
    title: "Social Experience",
    desc: "Posts, stories, reels, long-form, polls, spaces. A reputation graph that replaces vanity metrics with earned trust.",
  },
  {
    icon: Film,
    title: "Streaming & Cinema",
    desc: "Long-form films, series, live events. 4K HDR, Dolby Atmos, synced Watch Together with AI commentary overlays.",
  },
  {
    icon: Globe,
    title: "Web Browse & Sites",
    desc: "Privacy-first in-app browser. Publish your own site visible across NEXUS — drag-and-drop, custom domains.",
  },
  {
    icon: Gamepad2,
    title: "Gaming & Sports Hub",
    desc: "Game discovery, downloads, esports, fantasy leagues, and party games launchable from any chat thread.",
  },
  {
    icon: Boxes,
    title: "NexOS App Ecosystem",
    desc: "Commission bespoke apps built by the NEXUS team — hosted natively, no third-party API integrations, ever.",
  },
];

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
          <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">
            § 02 · Super-App Vision
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            One app.{" "}
            <span className="text-gradient-aurora">Seven pillars.</span>{" "}
            <span className="text-muted-foreground">Every experience.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            NEXUS is not a feature aggregation. It's a living digital ecosystem
            where each pillar is a first-class, natively built experience —
            with no external app dependencies.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="pillar-card group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="h-11 w-11 rounded-lg bg-surface-elevated border border-border grid place-items-center group-hover:border-primary/50 transition-colors">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} />
                  </div>
                  <span className="font-mono-display text-xs text-muted-foreground/60">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-2 tracking-tight">
                  {p.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.desc}
                </p>
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
            <div className="relative">
              <p className="text-xs font-mono-display uppercase tracking-widest opacity-80 mb-4">
                Manifesto
              </p>
              <p className="text-2xl sm:text-3xl font-semibold leading-snug">
                NEXUS never integrates third-party apps via APIs. Every
                experience is built natively or hosted inside the NexOS sandbox
                — giving users one consistent, private environment.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}