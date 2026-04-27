import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/nexus/Nav";
import { VideoFeed } from "@/components/nexus/VideoFeed";
import { Hero } from "@/components/nexus/Hero";
import { Pillars } from "@/components/nexus/Pillars";
import { Vision } from "@/components/nexus/Vision";
import { NexOS } from "@/components/nexus/NexOS";
import { Pricing } from "@/components/nexus/Pricing";
import { CTA } from "@/components/nexus/CTA";
import { Footer } from "@/components/nexus/Footer";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [showFeed, setShowFeed] = useState(true);

  if (showFeed) {
    return (
      <div className="relative h-screen w-full overflow-hidden">
        <VideoFeed />
        <div className="absolute top-16 left-4 z-20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFeed(false)}
            className="text-white bg-black/30 backdrop-blur hover:bg-black/50"
          >
            ← Explore NEXUS
          </Button>
        </div>
      </div>
    );
  }

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
      <button
        onClick={() => setShowFeed(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-glow-cyan hover:scale-105 transition-all"
      >
        ▶ Watch Feed
      </button>
    </div>
  );
}
