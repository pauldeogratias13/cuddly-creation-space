/**
 * PostFork.tsx - Post forking/remix system
 * Allows users to create derivative works from existing posts
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, MessageCircle, Send, X, Copy, Sparkles } from "lucide-react";
import { useSocialFeed, type FeedPost } from "@/hooks/use-social-feed";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface PostForkProps {
  post: FeedPost;
  onFork: (originalPostId: string, text: string, options?: { anonymous?: boolean }) => Promise<boolean>;
  isOpen: boolean;
  onClose: () => void;
}

export function PostFork({ post, onFork, isOpen, onClose }: PostForkProps) {
  const { user, profile } = useAuth();
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setText("");
    setIsAnonymous(false);
    setIsSubmitting(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!user) {
      toast.error("Sign in to fork posts");
      return;
    }

    if (!text.trim()) {
      toast.error("Add your thoughts to the fork");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onFork(post.id, text, { anonymous: isAnonymous });
      
      if (success) {
        toast.success("Post forked successfully!");
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error("Fork error:", error);
      toast.error("Could not fork post");
    } finally {
      setIsSubmitting(false);
    }
  }, [user, text, isAnonymous, post.id, onFork, onClose, resetForm]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleCopyOriginal = useCallback(() => {
    const originalText = `${post.text}\n\n---\nForked from @${post.author?.handle || "unknown"}`;
    setText(originalText);
    toast.success("Original post copied");
  }, [post.text, post.author?.handle]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
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
          className="bg-surface rounded-2xl border border-border max-w-lg w-full max-h-[80vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-violet-400" />
              <h3 className="text-sm font-semibold">Fork Post</h3>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Original post preview */}
          <div className="p-4 border-b border-border/50 bg-surface-elevated/30">
            <div className="flex items-start gap-3">
              <img
                src={post.author?.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${post.author?.handle || 'default'}&backgroundColor=0f172a`}
                alt={post.author?.display_name || post.author?.handle}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">
                  {post.author?.display_name || post.author?.handle}
                </p>
                <p className="text-xs text-muted-foreground mb-2">
                  Original post • {post.text.slice(0, 100)}{post.text.length > 100 ? "..." : ""}
                </p>
                <button
                  onClick={handleCopyOriginal}
                  className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copy original text
                </button>
              </div>
            </div>
          </div>

          {/* Fork composition */}
          <div className="p-4">
            <div className="flex gap-3 mb-3">
              <img
                src={isAnonymous ? null : (profile?.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${profile?.handle || 'default'}&backgroundColor=0f172a`)}
                alt={isAnonymous ? "Anonymous" : (profile?.display_name || profile?.handle)}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Share your thoughts on this post..."
                  rows={4}
                  className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none leading-relaxed border border-border/50 rounded-lg px-3 py-2 focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isAnonymous
                      ? "bg-violet-500/10 border-violet-500/40 text-violet-400"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  {isAnonymous ? "Anonymous" : "Public"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || isSubmitting}
                  className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold bg-violet-500 text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  {isSubmitting ? (
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Fork
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Fork tree visualization component
export function ForkTree({ post, forks }: { post: FeedPost; forks?: FeedPost[] }) {
  const [showTree, setShowTree] = useState(false);

  // Mock fork data for visualization
  const mockForks = forks || [
    {
      ...post,
      id: `${post.id}-fork-1`,
      text: "I agree with this perspective, and I'd add that...",
      author: {
        id: "user1",
        handle: "alice_dev",
        display_name: "Alice Chen",
        avatar_url: null,
      },
      fork_depth: 1,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    } as FeedPost,
    {
      ...post,
      id: `${post.id}-fork-2`,
      text: "Here's my take on this idea with a different approach...",
      author: {
        id: "user2",
        handle: "bob_builder",
        display_name: "Bob Smith",
        avatar_url: null,
      },
      fork_depth: 1,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    } as FeedPost,
  ];

  if (mockForks.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setShowTree(!showTree)}
        className="flex items-center gap-1.5 text-[10px] text-violet-400 hover:text-violet-300 transition-colors"
      >
        <GitBranch className="h-3 w-3" />
        {mockForks.length} fork{mockForks.length !== 1 ? "s" : ""}
        {showTree ? "▼" : "▶"}
      </button>

      <AnimatePresence>
        {showTree && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-2 border-l-2 border-violet-500/30 pl-4 ml-2"
          >
            {mockForks.map(fork => (
              <motion.div
                key={fork.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface/40 rounded-lg p-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <img
                    src={fork.author?.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${fork.author?.handle || 'default'}&backgroundColor=0f172a`}
                    alt={fork.author?.display_name || fork.author?.handle}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="text-[10px] font-semibold text-foreground">
                    {fork.author?.display_name || fork.author?.handle}
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    forked
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {fork.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Fork indicator badge
export function ForkIndicator({ depth, forksCount }: { depth: number; forksCount?: number }) {
  if (depth === 0 && !forksCount) return null;

  return (
    <div className="flex items-center gap-1 text-[10px] text-violet-400 mb-2">
      <GitBranch className="h-3 w-3" />
      {depth > 0 && <span>Fork depth {depth}</span>}
      {forksCount && forksCount > 0 && (
        <span>{forksCount} fork{forksCount !== 1 ? "s" : ""}</span>
      )}
    </div>
  );
}
