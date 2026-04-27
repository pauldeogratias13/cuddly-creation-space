import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/nexus/Nav";
import { Hero } from "@/components/nexus/Hero";
import { Pillars } from "@/components/nexus/Pillars";
import { Vision } from "@/components/nexus/Vision";
import { NexOS } from "@/components/nexus/NexOS";
import { Pricing } from "@/components/nexus/Pricing";
import { CTA } from "@/components/nexus/CTA";
import { Footer } from "@/components/nexus/Footer";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <Pillars />
        <Vision />
        <NexOS />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
