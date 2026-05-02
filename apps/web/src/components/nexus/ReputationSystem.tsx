/**
 * ReputationSystem.tsx - User reputation and domain expertise system
 * Tracks user reputation scores, domain expertise badges, and achievement tiers
 */
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Star, Trophy, Crown, Shield, Award, Zap, Target, Flame, Gem } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export interface UserReputation {
  user_id: string;
  overall_score: number;
  domain_expertise: {
    domain: string;
    score: number;
    level: "beginner" | "intermediate" | "advanced" | "expert" | "master";
    badges: string[];
  }[];
  achievements: Achievement[];
  streak_days: number;
  quality_score: number;
  engagement_score: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned_at: string;
  progress?: number;
  max_progress?: number;
}

interface ReputationBadgeProps {
  score: number | null;
  domain: string | null;
  showLevel?: boolean;
  compact?: boolean;
}

export function ReputationBadge({ 
  score, 
  domain, 
  showLevel = true, 
  compact = false 
}: ReputationBadgeProps) {
  if (!score || !domain) return null;

  const tier = getReputationTier(score);
  const level = getExpertiseLevel(score);

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${tier.color}`}>
        <Star className="h-2 w-2" />
        {domain} · {score}
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${tier.color}`}>
      <Star className="h-2 w-2" />
      <span>{domain}</span>
      <span>·</span>
      <span>{score}</span>
      {showLevel && (
        <>
          <span>·</span>
          <span>{level}</span>
        </>
      )}
    </div>
  );
}

interface ReputationCardProps {
  reputation: UserReputation;
  showAchievements?: boolean;
  maxAchievements?: number;
}

export function ReputationCard({ 
  reputation, 
  showAchievements = true, 
  maxAchievements = 6 
}: ReputationCardProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const overallTier = getReputationTier(reputation.overall_score);

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4 space-y-4">
      {/* Overall reputation */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          {getTierIcon(overallTier.tier)}
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          {overallTier.label}
        </h3>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono-display">{reputation.overall_score}</span>
          <span>points</span>
        </div>
        
        {/* Progress bar to next tier */}
        <div className="mt-3">
          <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
              style={{ width: `${getProgressToNextTier(reputation.overall_score)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {getPointsToNextTier(reputation.overall_score)} to {getNextTier(overallTier.tier)}
          </p>
        </div>
      </div>

      {/* Domain expertise */}
      <div>
        <h4 className="text-sm font-semibold mb-2">Domain Expertise</h4>
        <div className="space-y-2">
          {reputation.domain_expertise.map(domain => (
            <motion.button
              key={domain.domain}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedDomain(selectedDomain === domain.domain ? null : domain.domain)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface/50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getDomainIcon(domain.domain)}</span>
                  <div>
                    <p className="text-xs font-semibold">{domain.domain}</p>
                    <p className="text-[9px] text-muted-foreground capitalize">{domain.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-primary">{domain.score}</p>
                  <div className="flex gap-0.5 mt-0.5">
                    {generateStars(domain.score)}
                  </div>
                </div>
              </div>
              
              {/* Expanded domain details */}
              {selectedDomain === domain.domain && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 pt-2 border-t border-border/50"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {domain.badges.map(badge => (
                        <span key={badge} className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {badge}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Quality Score</p>
                        <p className="font-semibold">{reputation.quality_score}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Engagement</p>
                        <p className="font-semibold">{reputation.engagement_score}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Achievements */}
      {showAchievements && reputation.achievements.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Recent Achievements</h4>
          <div className="grid grid-cols-3 gap-2">
            {reputation.achievements.slice(0, maxAchievements).map(achievement => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
          {reputation.achievements.length > maxAchievements && (
            <button className="text-xs text-primary hover:underline mt-2">
              View all {reputation.achievements.length} achievements
            </button>
          )}
        </div>
      )}

      {/* Streak */}
      {reputation.streak_days > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="font-semibold">{reputation.streak_days}</span>
          <span className="text-muted-foreground">day streak</span>
        </div>
      )}
    </div>
  );
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative group"
    >
      <div className="w-full aspect-square rounded-lg bg-surface-elevated flex items-center justify-center text-2xl border border-border/50 hover:border-primary/30 transition-colors">
        {achievement.icon}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-surface border border-border rounded-lg shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-32 text-center">
        <p className="text-xs font-semibold">{achievement.name}</p>
        <p className="text-[9px] text-muted-foreground">{achievement.description}</p>
      </div>
    </motion.div>
  );
}

// Leaderboard component
export function ReputationLeaderboard({ 
  domain, 
  timeRange = "all" 
}: { 
  domain?: string; 
  timeRange?: "day" | "week" | "month" | "all"; 
}) {
  // Mock leaderboard data
  const mockLeaderboard = [
    {
      rank: 1,
      user: {
        id: "1",
        handle: "alice_dev",
        display_name: "Alice Chen",
        avatar_url: null,
      },
      score: 2847,
      domain: "Engineering",
      change: "up" as const,
      changeAmount: 12,
    },
    {
      rank: 2,
      user: {
        id: "2",
        handle: "bob_builder",
        display_name: "Bob Smith",
        avatar_url: null,
      },
      score: 2654,
      domain: "Design",
      change: "down" as const,
      changeAmount: 3,
    },
    {
      rank: 3,
      user: {
        id: "3",
        handle: "charlie_design",
        display_name: "Charlie Davis",
        avatar_url: null,
      },
      score: 2489,
      domain: "Product",
      change: "same" as const,
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Trophy className="h-3 w-3" />
          Leaderboard
        </h3>
        
        <select className="text-xs bg-surface border border-border rounded px-2 py-1">
          <option value="all">All time</option>
          <option value="month">This month</option>
          <option value="week">This week</option>
          <option value="day">Today</option>
        </select>
      </div>

      <div className="space-y-2">
        {mockLeaderboard.map(entry => (
          <motion.div
            key={entry.user.id}
            whileHover={{ x: 3 }}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface/50 transition-colors"
          >
            {/* Rank */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              entry.rank === 1 ? "bg-yellow-500 text-yellow-900" :
              entry.rank === 2 ? "bg-gray-400 text-gray-900" :
              entry.rank === 3 ? "bg-orange-600 text-orange-900" :
              "bg-surface-elevated text-muted-foreground"
            }`}>
              {entry.rank}
            </div>

            {/* User info */}
            <img
              src={entry.user.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${entry.user.handle || 'default'}&backgroundColor=0f172a`}
              alt={entry.user.display_name || entry.user.handle}
              className="w-8 h-8 rounded-full object-cover"
            />
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">
                {entry.user.display_name}
              </p>
              <p className="text-[9px] text-muted-foreground">
                {entry.domain}
              </p>
            </div>

            {/* Score and change */}
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{entry.score}</p>
              <div className={`flex items-center gap-0.5 text-[9px] ${
                entry.change === "up" ? "text-green-500" :
                entry.change === "down" ? "text-red-500" :
                "text-muted-foreground"
              }`}>
                {entry.change === "up" && <span>↑</span>}
                {entry.change === "down" && <span>↓</span>}
                {entry.changeAmount && <span>{entry.changeAmount}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Helper functions
function getReputationTier(score: number) {
  if (score >= 90) return { tier: "elite", label: "Elite", color: "text-amber-400 border-amber-400/40 bg-amber-500/10" };
  if (score >= 70) return { tier: "expert", label: "Expert", color: "text-cyan-400 border-cyan-400/40 bg-cyan-500/10" };
  if (score >= 50) return { tier: "notable", label: "Notable", color: "text-violet-400 border-violet-400/40 bg-violet-500/10" };
  return { tier: "rising", label: "Rising", color: "text-muted-foreground border-border bg-surface" };
}

function getExpertiseLevel(score: number): string {
  if (score >= 95) return "Master";
  if (score >= 80) return "Expert";
  if (score >= 60) return "Advanced";
  if (score >= 40) return "Intermediate";
  return "Beginner";
}

function getTierIcon(tier: string) {
  switch (tier) {
    case "elite":
      return <Crown className="h-8 w-8 text-amber-400" />;
    case "expert":
      return <Trophy className="h-8 w-8 text-cyan-400" />;
    case "notable":
      return <Award className="h-8 w-8 text-violet-400" />;
    default:
      return <Star className="h-8 w-8 text-muted-foreground" />;
  }
}

function getDomainIcon(domain: string): string {
  const icons: Record<string, string> = {
    "Engineering": "⚙️",
    "Design": "🎨",
    "Product": "📱",
    "Marketing": "📢",
    "Sales": "💼",
    "Support": "🤝",
    "Research": "🔬",
    "Data": "📊",
    "Security": "🔒",
    "AI": "🤖",
  };
  return icons[domain] || "📚";
}

function generateStars(score: number) {
  const stars = Math.min(5, Math.floor(score / 20));
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`h-2 w-2 ${i < stars ? "text-yellow-400 fill-current" : "text-muted-foreground"}`}
    />
  ));
}

function getProgressToNextTier(score: number): number {
  if (score >= 90) return 100;
  if (score >= 70) return ((score - 70) / 20) * 100;
  if (score >= 50) return ((score - 50) / 20) * 100;
  return (score / 50) * 100;
}

function getPointsToNextTier(score: number): string {
  if (score >= 90) return "Max tier";
  if (score >= 70) return `${90 - score} points`;
  if (score >= 50) return `${70 - score} points`;
  return `${50 - score} points`;
}

function getNextTier(currentTier: string): string {
  switch (currentTier) {
    case "rising": return "Notable";
    case "notable": return "Expert";
    case "expert": return "Elite";
    default: return "Max";
  }
}
