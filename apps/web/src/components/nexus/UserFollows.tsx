/**
 * UserFollows.tsx - User following/follower system
 * Handles follow/unfollow functionality, follower counts, and relationship status
 */
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, UserMinus, Check, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  handle: string | null;
  display_name: string | null;
  avatar_url: string | null;
  followers_count: number;
  following_count: number;
  is_following?: boolean;
}

interface UserFollowsProps {
  user: UserProfile;
  onFollow?: (userId: string) => Promise<void>;
  onUnfollow?: (userId: string) => Promise<void>;
  showCounts?: boolean;
  compact?: boolean;
}

export function FollowButton({ 
  user, 
  onFollow, 
  onUnfollow, 
  compact = false 
}: UserFollowsProps) {
  const { user: currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(user.is_following || false);

  const handleFollow = useCallback(async () => {
    if (!currentUser || currentUser.id === user.id) return;

    setIsLoading(true);

    try {
      if (isFollowing) {
        await onUnfollow?.(user.id);
        setIsFollowing(false);
        toast.success(`Unfollowed ${user.display_name || user.handle}`);
      } else {
        await onFollow?.(user.id);
        setIsFollowing(true);
        toast.success(`Following ${user.display_name || user.handle}`);
      }
    } catch (error) {
      console.error("Follow error:", error);
      toast.error("Could not update follow status");
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, user, isFollowing, onFollow, onUnfollow]);

  if (!currentUser || currentUser.id === user.id) {
    return null;
  }

  if (compact) {
    return (
      <button
        onClick={handleFollow}
        disabled={isLoading}
        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
          isFollowing
            ? "border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            : "bg-primary text-primary-foreground hover:opacity-90"
        } disabled:opacity-50`}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isFollowing ? (
          <>
            <UserMinus className="h-3 w-3" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="h-3 w-3" />
            Follow
          </>
        )}
      </button>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleFollow}
      disabled={isLoading}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
        isFollowing
          ? "border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
          : "bg-primary text-primary-foreground hover:opacity-90"
      } disabled:opacity-50`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Follow
        </>
      )}
    </motion.button>
  );
}

export function FollowerCount({ 
  user, 
  showCounts = true,
  onClick 
}: { 
  user: UserProfile; 
  showCounts?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <Users className="h-4 w-4" />
      <span className="font-semibold">{user.followers_count.toLocaleString()}</span>
      {showCounts && <span>followers</span>}
    </button>
  );
}

export function FollowingCount({ 
  user, 
  showCounts = true,
  onClick 
}: { 
  user: UserProfile; 
  showCounts?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <span className="font-semibold">{user.following_count.toLocaleString()}</span>
      {showCounts && <span>following</span>}
    </button>
  );
}

// Follow suggestions component
export function FollowSuggestions({ 
  suggestions, 
  onFollowUser 
}: { 
  suggestions: UserProfile[];
  onFollowUser: (userId: string) => Promise<void>;
}) {
  const { user: currentUser } = useAuth();
  const [followingIds, setFollowingIds] = useState<Set<string>>(
    new Set(suggestions.filter(u => u.is_following).map(u => u.id))
  );

  const handleFollow = useCallback(async (userId: string) => {
    try {
      await onFollowUser(userId);
      setFollowingIds(prev => new Set(prev).add(userId));
    } catch (error) {
      console.error("Follow suggestion error:", error);
    }
  }, [onFollowUser]);

  if (!currentUser || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          Who to follow
        </h3>
      </div>
      
      <div className="space-y-3">
        {suggestions.map(user => (
          <div key={user.id} className="flex items-center gap-2.5">
            <img
              src={user.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${user.handle || 'default'}&backgroundColor=0f172a`}
              alt={user.display_name || user.handle}
              className="w-8 h-8 rounded-full object-cover"
            />
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">
                {user.display_name || user.handle}
              </p>
              <p className="text-[10px] text-muted-foreground">
                @{user.handle}
              </p>
            </div>
            
            <button
              onClick={() => handleFollow(user.id)}
              disabled={followingIds.has(user.id)}
              className={`text-[10px] font-semibold rounded-full px-3 py-1 transition-all ${
                followingIds.has(user.id)
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {followingIds.has(user.id) ? (
                <Check className="h-3 w-3" />
              ) : (
                "Follow"
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Followers/Following list modal
export function FollowList({ 
  type, 
  userId, 
  onClose 
}: { 
  type: "followers" | "following"; 
  userId: string; 
  onClose: () => void;
}) {
  // Mock data - in real implementation, this would fetch from API
  const mockUsers: UserProfile[] = [
    {
      id: "1",
      handle: "alice_dev",
      display_name: "Alice Chen",
      avatar_url: null,
      followers_count: 1234,
      following_count: 567,
      is_following: true,
    },
    {
      id: "2",
      handle: "bob_builder",
      display_name: "Bob Smith",
      avatar_url: null,
      followers_count: 890,
      following_count: 234,
      is_following: false,
    },
    {
      id: "3",
      handle: "charlie_design",
      display_name: "Charlie Davis",
      avatar_url: null,
      followers_count: 567,
      following_count: 123,
      is_following: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-surface rounded-2xl border border-border max-w-md w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="text-sm font-semibold capitalize">
            {type === "followers" ? "Followers" : "Following"}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User list */}
        <div className="max-h-96 overflow-y-auto">
          {mockUsers.map(user => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 hover:bg-surface/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${user.handle || 'default'}&backgroundColor=0f172a`}
                  alt={user.display_name || user.handle}
                  className="w-10 h-10 rounded-full object-cover"
                />
                
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {user.display_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{user.handle}
                  </p>
                </div>
              </div>

              <FollowButton
                user={user}
                compact={true}
                onFollow={async () => {
                  console.log("Follow:", user.id);
                }}
                onUnfollow={async () => {
                  console.log("Unfollow:", user.id);
                }}
              />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Mutual followers indicator
export function MutualFollowers({ 
  mutualCount, 
  mutualUsers 
}: { 
  mutualCount: number; 
  mutualUsers?: UserProfile[];
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (mutualCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <span>Followed by</span>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="font-semibold text-foreground hover:underline"
      >
        {mutualCount} mutual{mutualCount === 1 ? "" : "s"}
      </button>
      
      {showDetails && mutualUsers && (
        <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg p-2 z-10">
          <div className="space-y-1">
            {mutualUsers.slice(0, 3).map(user => (
              <div key={user.id} className="flex items-center gap-2 text-xs">
                <img
                  src={user.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${user.handle || 'default'}&backgroundColor=0f172a`}
                  alt={user.display_name || user.handle}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span>{user.display_name || user.handle}</span>
              </div>
            ))}
            {mutualUsers.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{mutualUsers.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
