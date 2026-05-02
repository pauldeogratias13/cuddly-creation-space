/**
 * TrendingTopics.tsx - Trending hashtags and topics
 * Shows popular topics, engagement metrics, and hot indicators
 */
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Flame, Hash, ArrowUp, ArrowDown, Minus, ExternalLink } from "lucide-react";

interface TrendingTopic {
  id: string;
  tag: string;
  posts: number;
  engagement: number;
  change: "up" | "down" | "same";
  changePercent?: number;
  isHot: boolean;
  category?: string;
}

interface TrendingTopicsProps {
  topics?: TrendingTopic[];
  onTopicClick?: (tag: string) => void;
  maxItems?: number;
  showCategory?: boolean;
}

export function TrendingTopics({ 
  topics, 
  onTopicClick, 
  maxItems = 5, 
  showCategory = false 
}: TrendingTopicsProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Mock trending data if not provided
  const defaultTopics: TrendingTopic[] = [
    { 
      id: "1", 
      tag: "NEXUS2026", 
      posts: 12400, 
      engagement: 89200, 
      change: "up", 
      changePercent: 45, 
      isHot: true,
      category: "Platform"
    },
    { 
      id: "2", 
      tag: "AfricanTech", 
      posts: 8100, 
      engagement: 45600, 
      change: "up", 
      changePercent: 28, 
      isHot: true,
      category: "Technology"
    },
    { 
      id: "3", 
      tag: "AITwinLaunch", 
      posts: 6700, 
      engagement: 34200, 
      change: "up", 
      changePercent: 15, 
      isHot: false,
      category: "AI"
    },
    { 
      id: "4", 
      tag: "BuildInPublic", 
      posts: 4200, 
      engagement: 28900, 
      change: "down", 
      changePercent: 8, 
      isHot: false,
      category: "Startup"
    },
    { 
      id: "5", 
      tag: "CreatorEconomy", 
      posts: 3900, 
      engagement: 26700, 
      change: "same", 
      isHot: false,
      category: "Business"
    },
    { 
      id: "6", 
      tag: "Web3Africa", 
      posts: 3100, 
      engagement: 19800, 
      change: "up", 
      changePercent: 12, 
      isHot: false,
      category: "Blockchain"
    },
    { 
      id: "7", 
      tag: "DesignSystems", 
      posts: 2800, 
      engagement: 17600, 
      change: "up", 
      changePercent: 5, 
      isHot: false,
      category: "Design"
    },
    { 
      id: "8", 
      tag: "StartupLife", 
      posts: 2400, 
      engagement: 15400, 
      change: "down", 
      changePercent: 3, 
      isHot: false,
      category: "Startup"
    },
  ];

  const allTopics = topics || defaultTopics;
  const displayTopics = allTopics.slice(0, maxItems);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatEngagement = (engagement: number): string => {
    if (engagement >= 1000000) {
      return `${(engagement / 1000000).toFixed(1)}M`;
    } else if (engagement >= 1000) {
      return `${(engagement / 1000).toFixed(1)}K`;
    }
    return engagement.toString();
  };

  const handleTopicClick = useCallback((tag: string) => {
    setSelectedTopic(tag);
    onTopicClick?.(tag);
  }, [onTopicClick]);

  const getChangeIcon = (change: "up" | "down" | "same") => {
    switch (change) {
      case "up":
        return <ArrowUp className="h-3 w-3 text-green-500" />;
      case "down":
        return <ArrowDown className="h-3 w-3 text-red-500" />;
      case "same":
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getChangeColor = (change: "up" | "down" | "same") => {
    switch (change) {
      case "up":
        return "text-green-500";
      case "down":
        return "text-red-500";
      case "same":
        return "text-muted-foreground";
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3" />
          Trending
        </h3>
        
        {allTopics.length > maxItems && (
          <button className="text-[10px] text-primary hover:underline font-medium">
            See all
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {displayTopics.map((topic, index) => (
          <motion.button
            key={topic.id}
            whileHover={{ x: 3 }}
            onClick={() => handleTopicClick(topic.tag)}
            className={`w-full flex items-center justify-between rounded-lg hover:bg-surface transition-colors px-2 py-1.5 group ${
              selectedTopic === topic.tag ? "bg-primary/10 border border-primary/30" : ""
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Rank */}
              <span className="text-[10px] font-mono-display text-muted-foreground/50 w-4 shrink-0">
                {index + 1}
              </span>
              
              {/* Topic info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold group-hover:text-primary transition-colors flex items-center gap-1">
                    <Hash className="h-3 w-3 opacity-60" />
                    {topic.tag}
                  </span>
                  
                  {topic.isHot && (
                    <Flame className="h-3 w-3 text-orange-400" />
                  )}
                  
                  {topic.changePercent && topic.change !== "same" && (
                    <span className={`text-[9px] font-medium flex items-center gap-0.5 ${getChangeColor(topic.change)}`}>
                      {getChangeIcon(topic.change)}
                      {topic.changePercent}%
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{formatNumber(topic.posts)} posts</span>
                  <span>•</span>
                  <span>{formatEngagement(topic.engagement)} engagement</span>
                  {showCategory && topic.category && (
                    <>
                      <span>•</span>
                      <span className="text-primary/70">{topic.category}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* External link indicator */}
            <ExternalLink className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </div>
      
      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-border/50">
        <div className="flex items-center justify-between">
          <p className="text-[9px] text-muted-foreground/60">
            Updated 5 min ago
          </p>
          
          <button className="text-[9px] text-primary hover:underline font-medium">
            View algorithm →
          </button>
        </div>
      </div>
    </div>
  );
}

// Hashtag suggestion component for post composer
export function HashtagSuggestions({ 
  query, 
  onSelect 
}: { 
  query: string; 
  onSelect: (tag: string) => void;
}) {
  const allTags = [
    "NEXUS2026", "AfricanTech", "AITwinLaunch", "BuildInPublic", 
    "CreatorEconomy", "Web3Africa", "DesignSystems", "StartupLife",
    "TechNews", "Innovation", "DevLife", "ProductLaunch", "OpenSource"
  ];

  const filteredTags = query
    ? allTags.filter(tag => 
        tag.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : allTags.slice(0, 3);

  if (filteredTags.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-surface border border-border rounded-xl shadow-lg p-2 z-10">
      <p className="text-[9px] text-muted-foreground mb-1 px-1">Suggested hashtags</p>
      <div className="space-y-1">
        {filteredTags.map(tag => (
          <button
            key={tag}
            onClick={() => onSelect(tag)}
            className="w-full text-left px-2 py-1 text-xs hover:bg-surface-elevated rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Hash className="h-3 w-3 text-muted-foreground" />
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

// Topic detail modal for when a user clicks on a trending topic
export function TopicDetail({ 
  topic, 
  onClose 
}: { 
  topic: TrendingTopic; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-2xl border border-border max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">#{topic.tag}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-elevated rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">{formatNumber(topic.posts)}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
            <div className="bg-surface-elevated rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-primary">{formatEngagement(topic.engagement)}</p>
              <p className="text-xs text-muted-foreground">Engagement</p>
            </div>
          </div>
          
          {/* Trend info */}
          <div className="flex items-center justify-between py-2 border-y border-border/50">
            <span className="text-sm text-muted-foreground">Trend status</span>
            <div className="flex items-center gap-2">
              {topic.isHot && (
                <span className="flex items-center gap-1 text-sm text-orange-400">
                  <Flame className="h-4 w-4" />
                  Hot
                </span>
              )}
              <span className={`flex items-center gap-1 text-sm ${getChangeColor(topic.change)}`}>
                {getChangeIcon(topic.change)}
                {topic.changePercent}%
              </span>
            </div>
          </div>
          
          {/* Recent posts placeholder */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Recent posts</h3>
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">Topic posts coming soon!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function formatEngagement(engagement: number): string {
  if (engagement >= 1000000) {
    return `${(engagement / 1000000).toFixed(1)}M`;
  } else if (engagement >= 1000) {
    return `${(engagement / 1000).toFixed(1)}K`;
  }
  return engagement.toString();
}

function getChangeIcon(change: "up" | "down" | "same") {
  switch (change) {
    case "up":
      return <ArrowUp className="h-3 w-3 text-green-500" />;
    case "down":
      return <ArrowDown className="h-3 w-3 text-red-500" />;
    case "same":
      return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
}

function getChangeColor(change: "up" | "down" | "same") {
  switch (change) {
    case "up":
      return "text-green-500";
    case "down":
      return "text-red-500";
    case "same":
      return "text-muted-foreground";
  }
}
