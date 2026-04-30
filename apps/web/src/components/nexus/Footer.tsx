export function Footer() {
  const year = new Date().getFullYear();

  const productLinks = [
    { label: "Pillars", href: "#pillars" },
    { label: "Vision", href: "#vision" },
    { label: "Streaming", href: "#streaming" },
    { label: "Social", href: "#social" },
    { label: "NexOS", href: "#nexos" },
    { label: "Pricing", href: "#pricing" },
    { label: "Waitlist", href: "#waitlist" },
  ];

  const stackItems = [
    "AV1 · SVT-AV1 Codec",
    "ScyllaDB · 1M+ writes/sec",
    "Cassandra 5 · Interaction logs",
    "ClickHouse · 100× analytics",
    "Qdrant · Vector search",
    "Kafka + Flink · Feature pipeline",
    "Neo4j AuraDB · Social graph",
    "KEDA · GPU autoscaling",
    "Widevine L1 DRM",
    "Cilium eBPF · Zero-trust mesh",
    "Signal Protocol E2E",
    "CMAF · Low-latency live",
  ];

  const privacyItems = [
    "Zero third-party cookies",
    "No Facebook SDK",
    "No Google Tags",
    "On-device ML inference",
    "IAB TCF 2.2 compliant",
    "GDPR-safe by design",
    "SLSA Level 3 supply chain",
    "HashiCorp Vault secrets",
    "Forensic watermarking",
    "mTLS zero-trust mesh",
  ];

  return (
    <footer className="border-t border-border py-16 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="font-display text-2xl font-bold tracking-tight mb-3">
              NEXUS<span className="text-gradient-aurora">.</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              One identity. Every experience. The world's first true super-app — AI-first,
              streaming-native, privacy-preserving. Built to outcompete every incumbent.
            </p>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              <span className="text-xs font-mono-display text-muted-foreground">
                v4.0 · 2026 Edition · Blueprint Active
              </span>
            </div>
            {/* Performance badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              {["<300ms", "AV1", "VMAF 93+", "E2E"].map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-mono-display text-primary"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-mono-display uppercase tracking-widest text-muted-foreground mb-4">
              Product
            </p>
            <ul className="space-y-2 text-sm">
              {productLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div>
            <p className="text-xs font-mono-display uppercase tracking-widest text-muted-foreground mb-4">
              Engineering Stack
            </p>
            <ul className="space-y-1.5 text-[11px] font-mono-display">
              {stackItems.map((t) => (
                <li key={t} className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-1 w-1 rounded-full bg-cyan-500/50 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Privacy */}
          <div>
            <p className="text-xs font-mono-display uppercase tracking-widest text-muted-foreground mb-4">
              Privacy by Design
            </p>
            <ul className="space-y-1.5 text-[11px]">
              {privacyItems.map((t) => (
                <li key={t} className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-mono">
            © {year} NEXUS · Confidential — Internal Use Only · Architecture Blueprint v4.0
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>Faster than TikTok. Sharper than Netflix.</span>
            <span className="hidden sm:inline">·</span>
            <span>Privacy over profit.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
