import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/nexus/Nav";
import { VideoFeed } from "@/components/nexus/VideoFeed";
import { Hero } from "@/components/nexus/Hero";
import { Pillars } from "@/components/nexus/Pillars";
import { Vision } from "@/components/nexus/Vision";
import { StreamingShowcase } from "@/components/nexus/StreamingShowcase";
import { SocialEngine } from "@/components/nexus/SocialEngine";
import { NexOS } from "@/components/nexus/NexOS";
import { Pricing } from "@/components/nexus/Pricing";
import { CTA } from "@/components/nexus/CTA";
import { Footer } from "@/components/nexus/Footer";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Play, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [showFeed, setShowFeed] = useState(false);

  return (
    <>
      <AnimatePresence mode="wait">
        {showFeed ? (
          <motion.div
            key="feed"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="relative h-screen w-full overflow-hidden"
          >
            <VideoFeed />
            <div className="absolute left-4 top-4 z-50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFeed(false)}
                className="flex items-center gap-2 bg-black/40 text-white backdrop-blur hover:bg-black/60 rounded-full px-4"
              >
                <ArrowLeft className="h-4 w-4" />
                NEXUS
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen bg-background text-foreground"
          >
            <Nav onOpenFeed={() => setShowFeed(true)} />
            <main>
              {/* 01 — Cinematic hero with tech stack */}
              <Hero />

              {/* 02 — Seven pillar overview */}
              <Pillars />

              {/* 03 — Platform vision + engineering stack */}
              <Vision />

              {/* 04 — Streaming engine: pipeline, QoE, competitor table */}
              <StreamingShowcase />

              {/* 05 — Social engine: intent feed, features, creator rev share */}
              <SocialEngine />

              {/* 06 — NexOS app ecosystem */}
              <NexOS />

              {/* 07 — Subscription + advertiser pricing */}
              <Pricing />

              {/* 08 — Waitlist CTA */}
              <CTA />
            </main>
            <Footer />

            {/* Floating feed button */}
            <motion.button
              type="button"
              onClick={() => setShowFeed(true)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow-cyan transition-all hover:scale-105"
            >
              <Play className="h-4 w-4 fill-current" />
              Watch Feed
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
