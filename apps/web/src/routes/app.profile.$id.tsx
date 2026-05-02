import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  GitBranch, Sparkles, Send, Image as ImageIcon, Smile,
  TrendingUp, Users, Zap, ShieldCheck, Plus, X, RefreshCw,
  Eye, BarChart2, Lock, BarChart, Ghost, Radio, Flame,
  ChevronDown, Repeat2, ExternalLink, Star, UserPlus, UserMinus,
  DollarSign, Crown, Award, CheckCircle, AlertCircle, Play
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCreatorProfile, useGatedContent } from "@nexus/shared";
import type { CreatorTier, CreatorStats } from "@nexus/shared";

export const Route = createFileRoute("/app/profile/$id")({
  head: () => ({
    meta: [
      { title: "Creator Profile — NEXUS" },
      { name: "description", content: "Discover amazing creators and their content on NEXUS." },
    ],
  }),
  component: ProfileViewPage,
});

function ProfileViewPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "videos" | "gated">("posts");
  const [tipAmount, setTipAmount] = useState("");

  const {
    profile,
    tiers,
    subscription,
    stats,
    creatorPosts,
    creatorVideos,
    isLoading,
    error,
    subscribe,
    tip,
    isSubscribing,
    isTipping
  } = useCreatorProfile(id ?? "");

  const { content: gatedContent } = useGatedContent(id ?? "");

  const handleSubscribe = (tier: CreatorTier) => {
    if (!user) return;
    subscribe({ tierId: tier.id });
  };

  const handleTip = () => {
    if (!user || !tipAmount) return;
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) return;

    tip({ amount, message: "Thank you for your amazing content!" });
    setTipAmount("");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="animate-pulse space-y-8">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-gray-300 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-300 rounded w-32"></div>
              <div className="h-4 bg-gray-300 rounded w-48"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <UserPlus className="h-12 w-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
        <p className="text-muted-foreground">This creator profile doesn't exist or has been removed.</p>
        <Link to="/app/social" className="inline-flex items-center gap-2 mt-4 text-primary hover:underline">
          <Sparkles className="h-4 w-4" />
          Back to Social
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-8 mb-8">
        <div className="flex items-start gap-6">
          <img
            src={profile.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${profile.username}&backgroundColor=f1f5f9`}
            alt={profile.username || "Creator"}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-background"
          />

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              {stats?.reputation_score && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                  stats.reputation_score >= 90 ? 'bg-amber-100 text-amber-800' :
                  stats.reputation_score >= 70 ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  <ShieldCheck className="h-3 w-3" />
                  {stats.reputation_score >= 90 ? "Elite" : stats.reputation_score >= 70 ? "Expert" : "Rising"}
                </div>
              )}
              {subscription && (
                <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Subscriber
                </div>
              )}
            </div>

            {profile.bio && (
              <p className="text-muted-foreground mb-4 max-w-2xl">{profile.bio}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.posts_count || 0}</div>
                <div className="text-sm text-muted-foreground">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.followers_count || 0}</div>
                <div className="text-sm text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.total_likes || 0}</div>
                <div className="text-sm text-muted-foreground">Likes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.total_views || 0}</div>
                <div className="text-sm text-muted-foreground">Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats?.total_subscribers || 0}</div>
                <div className="text-sm text-muted-foreground">Subscribers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">${stats?.total_earnings || 0}</div>
                <div className="text-sm text-muted-foreground">Earnings</div>
              </div>
            </div>

            {/* Domain Expertise */}
            {stats?.domain_expertise && stats.domain_expertise.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium text-muted-foreground mb-2">Domain Expertise</div>
                <div className="flex flex-wrap gap-2">
                  {stats.domain_expertise.map((domain) => (
                    <span key={domain} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {domain}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold"
              >
                <UserPlus className="h-4 w-4" />
                Follow
              </motion.button>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Tip amount"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm w-24"
                  min="1"
                  step="0.01"
                />
                <motion.button
                  onClick={handleTip}
                  disabled={isTipping || !tipAmount}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Heart className="h-4 w-4" />
                  {isTipping ? "Sending..." : "Tip"}
                </motion.button>
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-muted transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Tiers */}
      {!subscription && tiers.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-semibold">Support {profile.username}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {tiers.map((tier) => (
              <motion.div
                key={tier.id}
                whileHover={{ scale: 1.02 }}
                className="border border-border rounded-xl p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{tier.name}</h3>
                  <div className="text-right">
                    <div className="text-lg font-bold">${tier.price}</div>
                    <div className="text-sm text-muted-foreground">/month</div>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground mb-3">
                  {tier.subscriber_count || 0} subscribers
                </div>

                <ul className="space-y-1 mb-4">
                  {tier.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <motion.button
                  onClick={() => handleSubscribe(tier)}
                  disabled={isSubscribing}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubscribing ? "Subscribing..." : "Subscribe"}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className="flex border-b border-border mb-8">
        {[
          { key: "posts", label: "Posts", count: stats?.posts_count || 0 },
          { key: "videos", label: "Videos", count: creatorVideos.length },
          { key: "gated", label: "Exclusive", count: gatedContent.length }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "posts" && (
        <div className="space-y-6">
          {creatorPosts.length > 0 ? (
            creatorPosts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-6"
              >
                <div className="flex items-start gap-3 mb-4">
                  <img
                    src={post.profile?.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${post.profile?.username || post.user_id}`}
                    alt={post.profile?.username || "Creator"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{post.profile?.username || profile.username}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-foreground">{post.text}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {post.likes_count}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {post.comments?.length || 0}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16">
              <BarChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No creator posts yet</h3>
              <p className="text-muted-foreground">
                This creator hasn't published any posts yet.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "videos" && (
        <div className="grid md:grid-cols-2 gap-6">
          {creatorVideos.length > 0 ? (
            creatorVideos.map((video) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-video bg-muted relative">
                  <img
                    src={video.thumbnail_url || "https://via.placeholder.com/400x225"}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                      <Play className="h-6 w-6 text-black ml-1" />
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{video.title}</h3>
                  {video.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{video.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {video.created_at ? new Date(video.created_at).toLocaleDateString() : "—"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {video.social_post?.likes_count ?? "—"}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-16 col-span-2">
              <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No videos yet</h3>
              <p className="text-muted-foreground">
                This creator doesn't have any published videos yet.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "gated" && (
        <div className="text-center py-16">
          {subscription ? (
            <div>
              <Lock className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Exclusive Content Unlocked</h3>
              <p className="text-muted-foreground mb-6">
                Behind-the-scenes content, early access, and premium materials available to subscribers only.
              </p>
              {gatedContent.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  {gatedContent.map((item) => (
                    <div key={item.id} className="bg-card rounded-xl border border-border p-6">
                      <h4 className="font-semibold mb-2">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No exclusive content available yet.</p>
              )}
            </div>
          ) : (
            <div>
              <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Subscriber-Only Content</h3>
              <p className="text-muted-foreground mb-6">
                Exclusive content, early access, and premium materials are available to subscribers of {profile.username}.
              </p>
              {tiers.length > 0 && (
                <motion.button
                  onClick={() => handleSubscribe(tiers[0])}
                  whileTap={{ scale: 0.95 }}
                  className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors"
                >
                  Become a Subscriber
                </motion.button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}