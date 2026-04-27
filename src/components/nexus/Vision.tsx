import { motion } from "framer-motion";
import { Sparkles, GitBranch, ShieldCheck, Radio } from "lucide-react";

const items = [
  {
    icon: Sparkles,
    title: "Intent-First Feed",
    desc: "Set your mood — learn, create, explore, chill. The feed serves only matching content. No bait-and-switch.",
  },
  {
    icon: Radio,
    title: "AI Identity Layer",
    desc: "Every user gets an AI twin that learns their style, drafts replies, and acts as an autonomous agent.",
  },
  {
    icon: GitBranch,
    title: "Evolving Content",
    desc: "Posts can be forked, remixed, evolved. Content lives as a tree with full provenance — like a Git repo.",
  },
  {
    icon: ShieldCheck,
    title: "Reputation Graph",
    desc: "Trust scores replace vanity metrics. Influence in design is separate from coding. Earned, not bought.",
  },
];

export function Vision() {
  return (
    <section id="vision" className="relative py-32 px-6 border-t border-border">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-12 gap-16">
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
            AI-first, streaming-native, privacy-preserving. Built from the
            ground up to be unmissable — and to give users what they actually
            asked for.
          </p>
        </motion.div>

        <div className="lg:col-span-7 space-y-4">
          {items.map((it, i) => {
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
                <div>
                  <h3 className="text-lg font-semibold tracking-tight mb-1.5">
                    {it.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {it.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}