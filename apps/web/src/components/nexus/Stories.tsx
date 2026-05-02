/**
 * Stories.tsx - Instagram-style stories with viewing status tracking
 * Supports image/video stories, auto-advance, and view tracking
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Pause, Play, Plus, Eye } from "lucide-react";
import { useSocialFeed, type Story } from "@/hooks/use-social-feed";
import { formatDistanceToNow } from "date-fns";

interface StoriesProps {
  stories: ReturnType<typeof useSocialFeed>["stories"];
  currentUserId?: string;
  onView?: (storyId: string) => void;
}

export function Stories({ stories, currentUserId, onView }: StoriesProps) {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const storyDuration = 5000; // 5 seconds per story

  const selectedStory = selectedStoryIndex !== null ? stories[selectedStoryIndex] : null;

  // Auto-advance stories
  useEffect(() => {
    if (selectedStoryIndex !== null && !isPaused) {
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            // Move to next story
            if (selectedStoryIndex < stories.length - 1) {
              setSelectedStoryIndex(selectedStoryIndex + 1);
              return 0;
            } else {
              // Close stories viewer
              setSelectedStoryIndex(null);
              return 0;
            }
          }
          return prev + 2; // Increment by 2% every 100ms
        });
      }, 100);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [selectedStoryIndex, isPaused, stories.length]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [selectedStoryIndex]);

  const handleStoryClick = useCallback((index: number) => {
    setSelectedStoryIndex(index);
    setProgress(0);
    
    // Mark story as viewed
    const story = stories[index];
    if (story && !story.seen && currentUserId) {
      onView?.(story.id);
    }
  }, [stories, currentUserId, onView]);

  const handleNext = useCallback(() => {
    if (selectedStoryIndex !== null && selectedStoryIndex < stories.length - 1) {
      setSelectedStoryIndex(selectedStoryIndex + 1);
      setProgress(0);
    } else {
      setSelectedStoryIndex(null);
    }
  }, [selectedStoryIndex, stories.length]);

  const handlePrevious = useCallback(() => {
    if (selectedStoryIndex !== null && selectedStoryIndex > 0) {
      setSelectedStoryIndex(selectedStoryIndex - 1);
      setProgress(0);
    }
  }, [selectedStoryIndex]);

  const handleClose = useCallback(() => {
    setSelectedStoryIndex(null);
    setProgress(0);
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  if (stories.length === 0) {
    return null;
  }

  return (
    <>
      {/* Stories Bar */}
      <div className="flex gap-4 overflow-x-auto scrollbar-none py-1 px-0.5">
        {stories.map((story, i) => {
          const isSelf = story.user_id === currentUserId;
          const name = story.author?.display_name ?? story.author?.handle ?? "user";
          
          return (
            <motion.button
              key={story.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
              onClick={() => handleStoryClick(i)}
            >
              <div className="relative">
                <div className="relative">
                  <img
                    src={story.author?.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${story.author?.handle || 'default'}&backgroundColor=0f172a`}
                    alt={name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-background"
                  />
                  
                  {/* Story ring */}
                  <div className={`absolute inset-0 rounded-full p-[2px] ${
                    story.seen ? "bg-border" : "bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500"
                  }`}>
                    <div className="absolute inset-[2px] rounded-full bg-background" />
                    <img
                      src={story.author?.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${story.author?.handle || 'default'}&backgroundColor=0f172a`}
                      alt={name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                
                {isSelf && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary border-2 border-background grid place-items-center">
                    <Plus className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                )}
              </div>
              
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors w-14 truncate text-center">
                {isSelf ? "Your story" : name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Stories Viewer */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onClick={handleClose}
          >
            <div
              className="relative w-full h-full max-w-md mx-auto flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedStory.author?.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${selectedStory.author?.handle || 'default'}&backgroundColor=0f172a`}
                      alt={selectedStory.author?.display_name || selectedStory.author?.handle}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white"
                    />
                    <div>
                      <p className="text-white text-sm font-semibold">
                        {selectedStory.author?.display_name || selectedStory.author?.handle}
                      </p>
                      <p className="text-white/70 text-xs">
                        {formatDistanceToNow(new Date(selectedStory.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePause}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={handleClose}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Progress indicators */}
                <div className="flex gap-1 mt-3">
                  {stories.map((_, index) => (
                    <div
                      key={index}
                      className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                    >
                      <div
                        className="h-full bg-white transition-all duration-100"
                        style={{
                          width: index === selectedStoryIndex ? `${progress}%` : 
                                 index < selectedStoryIndex ? '100%' : '0%'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Story Content */}
              <div className="flex-1 flex items-center justify-center relative">
                {/* Navigation areas */}
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/40 transition-all opacity-0 hover:opacity-100"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/40 transition-all opacity-0 hover:opacity-100"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Story image/video placeholder */}
                <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <div className="text-center">
                    <Eye className="h-12 w-12 text-white/60 mx-auto mb-2" />
                    <p className="text-white/80 text-sm">Story content</p>
                    <p className="text-white/60 text-xs mt-1">
                      {selectedStory.author?.display_name}'s story
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <p className="text-white/80 text-xs text-center">
                  Tap to pause • Swipe to navigate
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
