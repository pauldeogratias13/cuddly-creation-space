import { motion } from "framer-motion";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Everything you need to live inside NEXUS.",
    features: [
      "All seven pillars",
      "E2E encrypted chat",
      "Standard streaming (1080p)",
      "Cohort-based ads",
      "Personal AI twin (lite)",
    ],
    cta: "Claim handle",
    highlight: false,
  },
  {
    name: "Plus",
    price: "$9",
    period: "/month",
    desc: "For creators, sellers and power users.",
    features: [
      "4K HDR + Dolby Atmos",
      "Ad-free everywhere",
      "Full AI twin + agent",
      "Storefront + escrow",
      "Site hosting (custom domain)",
      "100K-member channels",
    ],
    cta: "Go Plus",
    highlight: true,
  },
  {
    name: "NexOS",
    price: "Custom",
    period: "from $499",
    desc: "Commission a bespoke app inside NEXUS.",
    features: [
      "Everything in Plus",
      "Bespoke web/mobile app",
      "Built by NEXUS engineers",
      "Native NEXUS identity & payments",
      "Promotion to relevant cohorts",
      "Priority SLA",
    ],
    cta: "Talk to us",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative py-32 px-6 border-t border-border"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <p className="text-xs font-mono-display uppercase tracking-widest text-primary mb-4">
            § 05 · Subscription Tiers
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            Pick your{" "}
            <span className="text-gradient-aurora">tier of NEXUS.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Free forever for everyone. Upgrade when you want cinema-grade
            playback, an ad-free feed, or a bespoke app of your own.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                t.highlight
                  ? "border-primary/60 bg-surface shadow-glow-cyan"
                  : "border-border bg-surface/60"
              }`}
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-aurora text-primary-foreground text-xs font-mono-display uppercase tracking-widest px-3 py-1 rounded-full">
                  Most popular
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold tracking-tight">{t.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              </div>
              <div className="my-8 flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight">
                  {t.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {t.period}
                </span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <Check
                      className="h-4 w-4 text-primary mt-0.5 shrink-0"
                      strokeWidth={2.5}
                    />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#"
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
      </div>
    </section>
  );
}