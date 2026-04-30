import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "€0",
    period: "forever",
    blueprintRef: "§05 · FREE",
    desc: "Everything you need to live inside NEXUS.",
    features: [
      "All seven pillars — full access",
      "E2E encrypted chat",
      "Streaming (1080p, cohort ads)",
      "Personal AI twin (lite)",
      "Basic storefront (10 products)",
      "Community spaces (read)",
      "1 ad per 8 feed items",
    ],
    cta: "Claim handle",
    highlight: false,
    accent: "border-border",
  },
  {
    name: "Standard",
    price: "€9.99",
    period: "/month",
    blueprintRef: "§05 · STANDARD",
    desc: "For creators, sellers and power users.",
    features: [
      "4K HDR + Dolby Atmos streaming",
      "Full AI twin + agent mode",
      "Unlimited groups & DMs",
      "In-app privacy browser",
      "Site hosting (NEXUS domain)",
      "Store: unlimited products",
      "1 ad per 15 feed items",
    ],
    cta: "Go Standard",
    highlight: true,
    accent: "border-primary/60",
  },
  {
    name: "Premium",
    price: "€19.99",
    period: "/month",
    blueprintRef: "§05 · PREMIUM",
    desc: "Zero ads. Offline. Early access.",
    features: [
      "Everything in Standard",
      "Zero ads — completely ad-free",
      "Offline downloads (25 titles)",
      "Custom domain for site",
      "NexOS: 1 app commission/yr",
      "Creator monetisation tools",
      "Early feature access",
    ],
    cta: "Go Premium",
    highlight: false,
    accent: "border-violet-500/40",
  },
  {
    name: "Business",
    price: "€49.99",
    period: "/month",
    blueprintRef: "§05 · BUSINESS",
    desc: "Teams, white-label, dedicated support.",
    features: [
      "Everything in Premium",
      "Up to 5 team members",
      "NexOS: unlimited app commissions",
      "Verified business badge",
      "Advanced ad campaign tools",
      "API access (NEXUS data)",
      "Custom SLA · 99.9% uptime",
    ],
    cta: "Talk to us",
    highlight: false,
    accent: "border-amber-500/40",
  },
];

const AD_TIERS = [
  { name: "Community", price: "Free", desc: "Promote 1 post/week to your followers. Native feed card format." },
  { name: "Starter", price: "€49/mo", desc: "Feed cards + story ads. Intent-cohort targeting. Geographic filters." },
  { name: "Growth", price: "€299/mo", desc: "All formats incl. pre-roll. Lookalike audiences. Unlimited campaigns." },
  { name: "Enterprise", price: "Custom", desc: "Managed service. Homepage takeovers. Watch party sponsorship. Guaranteed impressions." },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-32 px-6 border-t border-border">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">§ 05 · Subscription Plans</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            Pick your{" "}
            <span className="text-gradient-aurora">tier of NEXUS.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Free forever for everyone. Upgrade when you want cinema-grade playback,
            an ad-free feed, or a bespoke app of your own.
          </p>
        </motion.div>

        {/* User tiers */}
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-20">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className={`relative rounded-2xl border p-7 flex flex-col ${
                t.highlight
                  ? `${t.accent} bg-surface shadow-glow-cyan`
                  : `${t.accent} bg-surface/60`
              }`}
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-aurora text-primary-foreground text-xs font-mono-display uppercase tracking-widest px-3 py-1 rounded-full">
                  <Zap className="h-3 w-3" />
                  Most popular
                </div>
              )}
              <div>
                <p className="text-[10px] font-mono-display text-muted-foreground/60 uppercase tracking-widest mb-1">{t.blueprintRef}</p>
                <h3 className="text-2xl font-bold tracking-tight">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              </div>
              <div className="my-7 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.period}</span>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" strokeWidth={2.5} />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#waitlist"
                className={`inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition-all ${
                  t.highlight
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-surface-elevated text-foreground border border-border hover:bg-surface"
                }`}
              >
                {t.cta}
              </a>
            </motion.div>
          ))}
        </div>

        {/* Advertiser tiers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8 text-center">
            <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-3">§ 05 · Advertiser Plans</p>
            <h3 className="text-2xl font-bold">Intent-matched advertising.</h3>
            <p className="mt-2 text-muted-foreground text-sm max-w-xl mx-auto">
              Every ad is contextually matched to the user's declared mood and intent.
              An ad shown to someone in 'learning' mode about photography is a camera — never a pizza coupon.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {AD_TIERS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="rounded-xl border border-border bg-surface/40 p-5"
              >
                <p className="text-xs font-mono-display text-muted-foreground uppercase tracking-widest mb-2">{t.name}</p>
                <p className="text-xl font-bold text-gradient-aurora">{t.price}</p>
                <p className="mt-3 text-sm text-muted-foreground">{t.desc}</p>
              </motion.div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            All ad plans subject to NEXUS Intent-Match Guard — ads only served to users in a contextually relevant state.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
