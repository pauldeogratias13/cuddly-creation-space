export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="font-display text-xl font-bold tracking-tight">
            NEXUS<span className="text-gradient-aurora">.</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            One identity. Every experience.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <a href="#pillars" className="hover:text-foreground transition-colors">Pillars</a>
          <a href="#vision" className="hover:text-foreground transition-colors">Vision</a>
          <a href="#nexos" className="hover:text-foreground transition-colors">NexOS</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          © {new Date().getFullYear()} NEXUS
        </div>
      </div>
    </footer>
  );
}