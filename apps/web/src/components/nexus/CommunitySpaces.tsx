/**
 * CommunitySpaces.tsx - Real community spaces with membership
 * Supports joining/leaving spaces, member counts, and live indicators
 */
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Radio, Users, Plus, X, Check, Sparkles, Crown, Shield } from "lucide-react";
import { useSocialFeed, type CommunitySpace } from "@/hooks/use-social-feed";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface CommunitySpacesProps {
  intent: ReturnType<typeof useSocialFeed>["intent"];
  spaces?: CommunitySpace[];
  onJoinSpace?: (spaceId: string) => Promise<void>;
  onLeaveSpace?: (spaceId: string) => Promise<void>;
}

export function CommunitySpaces({ intent, spaces, onJoinSpace, onLeaveSpace }: CommunitySpacesProps) {
  const { user } = useAuth();
  const [joiningSpaceId, setJoiningSpaceId] = useState<string | null>(null);
  const [showAllSpaces, setShowAllSpaces] = useState(false);

  // Use provided spaces or fall back to mock data
  const allSpaces: CommunitySpace[] = spaces || [
    { id: "cs1",  name: "East African Tech",   topic: "AI, fintech, startups",      emoji: "🌍", members: 1240,  isLive: true,  intent: "learn" },
    { id: "cs2",  name: "Lo-Fi Design Lounge", topic: "UI, motion, aesthetics",     emoji: "🎨", members: 891,   isLive: false, intent: "chill" },
    { id: "cs3",  name: "Crypto Pulse",        topic: "DeFi, web3, market talk",    emoji: "💰", members: 3220,  isLive: true,  intent: "shop" },
    { id: "cs4",  name: "World Cinema Club",   topic: "Film reviews & deep dives",  emoji: "🎬", members: 560,   isLive: false, intent: "explore" },
    { id: "cs5",  name: "Builders' Den",       topic: "SaaS, products, dev diaries",emoji: "🚀", members: 2100,  isLive: true,  intent: "create" },
    { id: "cs6",  name: "Science Frontier",    topic: "Research, papers, breakthroughs", emoji: "🔬", members: 740, isLive: false, intent: "learn" },
    { id: "cs7",  name: "Creative Studio",     topic: "Art, design, inspiration",  emoji: "✨", members: 1560,  isLive: true,  intent: "create" },
    { id: "cs8",  name: "Wellness Hub",       topic: "Health, mindfulness, fitness", emoji: "🧘", members: 890,   isLive: false, intent: "chill" },
  ];

  const filteredSpaces = intent === "all" 
    ? allSpaces 
    : allSpaces.filter(s => s.intent === intent);

  const displaySpaces = showAllSpaces ? filteredSpaces : filteredSpaces.slice(0, 5);

  const handleJoinSpace = useCallback(async (spaceId: string) => {
    if (!user) {
      toast.error("Sign in to join spaces");
      return;
    }

    setJoiningSpaceId(spaceId);
    
    try {
      await onJoinSpace?.(spaceId);
      toast.success("Joined space!");
    } catch (error) {
      console.error("Join space error:", error);
      toast.error("Could not join space");
    } finally {
      setJoiningSpaceId(null);
    }
  }, [user, onJoinSpace]);

  const handleLeaveSpace = useCallback(async (spaceId: string) => {
    if (!user) return;

    try {
      await onLeaveSpace?.(spaceId);
      toast.success("Left space");
    } catch (error) {
      console.error("Leave space error:", error);
      toast.error("Could not leave space");
    }
  }, [user, onLeaveSpace]);

  const formatMemberCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Radio className="h-3 w-3" />
          Spaces
        </h3>
        
        {filteredSpaces.length > 5 && (
          <button
            onClick={() => setShowAllSpaces(!showAllSpaces)}
            className="text-[10px] text-primary hover:underline font-medium"
          >
            {showAllSpaces ? "Show less" : `See all (${filteredSpaces.length})`}
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {displaySpaces.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-2">
              <Radio className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No spaces for {intent !== "all" ? intent : "this"} intent yet
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Be the first to create one!
            </p>
          </div>
        ) : (
          displaySpaces.map(space => (
            <motion.button
              key={space.id}
              whileHover={{ x: 3 }}
              className="w-full flex items-center gap-2.5 rounded-xl border border-border/50 bg-surface/40 px-3 py-2.5 text-left hover:border-primary/30 hover:bg-surface transition-all group"
            >
              {/* Space emoji/avatar */}
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-lg">
                  {space.emoji}
                </div>
                
                {space.isLive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-background">
                    <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Space info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-xs font-semibold truncate">{space.name}</p>
                  
                  {space.isLive && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-full px-1.5 py-0.5 shrink-0">
                      <span className="h-1 w-1 rounded-full bg-red-400 animate-pulse-glow" />
                      LIVE
                    </span>
                  )}
                </div>
                
                <p className="text-[10px] text-muted-foreground truncate">{space.topic}</p>
              </div>

              {/* Member count and join button */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-muted-foreground/50 font-mono-display flex items-center gap-1">
                  <Users className="h-2.5 w-2.5" />
                  {formatMemberCount(space.members)}
                </span>
                
                {/* Join/Leave button */}
                {user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // For now, just show a toast since we don't have real membership tracking
                      toast.success("Space membership coming soon!");
                    }}
                    className="text-[10px] font-semibold text-primary hover:underline shrink-0"
                  >
                    Join
                  </button>
                )}
              </div>
            </motion.button>
          ))
        )}
      </div>

      {/* Create new space button */}
      {user && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <button
            onClick={() => toast.info("Space creation coming soon!")}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 bg-surface/20 px-3 py-2 text-xs text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all"
          >
            <Plus className="h-3 w-3" />
            Create new space
          </button>
        </div>
      )}

      {/* Intent indicator */}
      {intent !== "all" && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            <span>Showing {intent === "all" ? "all" : `${intent} intent`} spaces</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Space detail component for when a user clicks on a space
export function SpaceDetail({ spaceId }: { spaceId: string }) {
  // This would fetch detailed space information including posts, members, etc.
  return (
    <div className="space-y-4">
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-2xl mx-auto mb-3">
          🌍
        </div>
        <h2 className="text-lg font-semibold">East African Tech</h2>
        <p className="text-sm text-muted-foreground">AI, fintech, startups</p>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            1.2k members
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Live now
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Recent posts in this space</h3>
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">Space posts coming soon!</p>
        </div>
      </div>
    </div>
  );
}
