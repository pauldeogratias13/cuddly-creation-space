import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

type VideoPost = {
  id: string;
  videoId: string;
  userId: string;
  text: string;
  likes: number;
  liked: boolean;
  createdAt: string;
};

type VideoComment = {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: string;
};

export function useVideoSocial(videoId: string) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<VideoPost[]>([]);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load posts and comments for this video
  useEffect(() => {
    if (!videoId) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        // Use existing social_posts table with video association in text
        const [postsRes, commentsRes, likesRes] = await Promise.all([
          supabase
            .from("social_posts")
            .select("id, user_id, text, likes_count, created_at")
            .like("text", `video:${videoId}:%`)
            .order("created_at", { ascending: false }),
          supabase
            .from("social_comments")
            .select("id, post_id, user_id, text, created_at")
            .in("post_id", (await supabase
              .from("social_posts")
              .select("id")
              .like("text", `video:${videoId}:%`)).data?.map(p => p.id) || [])
            .order("created_at", { ascending: true }),
          user ? supabase
            .from("social_post_likes")
            .select("post_id")
            .eq("user_id", user.id) : { data: [], error: null }
        ]);

        if (postsRes.error) throw postsRes.error;
        if (commentsRes.error) throw commentsRes.error;
        if (likesRes.error) throw likesRes.error;

        const postsData = (postsRes.data || []).map(p => {
          // Extract actual text from video:videoId:text format
          const textParts = p.text.split(':', 3);
          const actualText = textParts.length >= 3 ? textParts[2] : p.text;
          
          return {
            id: p.id,
            videoId: videoId,
            userId: p.user_id,
            text: actualText,
            likes: p.likes_count,
            liked: false,
            createdAt: p.created_at
          };
        });

        const likes = (likesRes.data || []).map((l: { post_id: string }) => l.post_id);
        
        setPosts(postsData.map(p => ({
          ...p,
          liked: likes.includes(p.id)
        })));
        setComments((commentsRes.data || []).map(c => ({
          id: c.id,
          postId: c.post_id,
          userId: c.user_id,
          text: c.text,
          createdAt: c.created_at
        })));
        setLikedPostIds(likes);
      } catch (error) {
        console.error("Error loading video social data:", error);
        toast.error("Failed to load social features");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [videoId, user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user || !videoId) return;

    const postsChannel = supabase
      .channel(`video-posts-${videoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "social_posts" },
        (payload) => {
          const newPost = payload.new as any;
          // Check if this post belongs to this video
          if (newPost.text && newPost.text.startsWith(`video:${videoId}:`)) {
            const textParts = newPost.text.split(':', 3);
            const actualText = textParts.length >= 3 ? textParts[2] : newPost.text;
            
            setPosts(prev => [
              {
                id: newPost.id,
                videoId: videoId,
                userId: newPost.user_id,
                text: actualText,
                likes: newPost.likes_count,
                liked: false,
                createdAt: newPost.created_at
              },
              ...prev
            ]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "social_posts" },
        (payload) => {
          const updated = payload.new as any;
          const postExists = posts.some(p => p.id === updated.id);
          if (!postExists) return;
          
          // Check if this post belongs to this video
          if (updated.text && updated.text.startsWith(`video:${videoId}:`)) {
            const textParts = updated.text.split(':', 3);
            const actualText = textParts.length >= 3 ? textParts[2] : updated.text;
            
            setPosts(prev => prev.map(p => 
              p.id === updated.id 
                ? { ...p, likes: updated.likes_count, text: actualText }
                : p
            ));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "social_posts" },
        (payload) => {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setPosts(prev => prev.filter(p => p.id !== deletedId));
            setComments(prev => prev.filter(c => c.postId !== deletedId));
            setLikedPostIds(prev => prev.filter(id => id !== deletedId));
          }
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel(`video-comments-${videoId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "social_comments" },
        (payload) => {
          const newComment = payload.new as any;
          // Check if this comment belongs to a post in this video
          const postExists = posts.some(p => p.id === newComment.post_id);
          if (postExists) {
            setComments(prev => [
              {
                id: newComment.id,
                postId: newComment.post_id,
                userId: newComment.user_id,
                text: newComment.text,
                createdAt: newComment.created_at
              },
              ...prev
            ]);
          }
        }
      )
      .subscribe();

    const likesChannel = supabase
      .channel(`video-likes-${videoId}-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "social_post_likes", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const postId = (payload.new as any)?.post_id || (payload.old as any)?.post_id;
          if (!postId) return;

          const postExists = posts.some(p => p.id === postId);
          if (!postExists) return;

          if (payload.eventType === "INSERT") {
            setLikedPostIds(prev => [...prev, postId]);
            setPosts(prev => prev.map(p => 
              p.id === postId ? { ...p, liked: true, likes: p.likes + 1 } : p
            ));
          } else if (payload.eventType === "DELETE") {
            setLikedPostIds(prev => prev.filter(id => id !== postId));
            setPosts(prev => prev.map(p => 
              p.id === postId ? { ...p, liked: false, likes: Math.max(0, p.likes - 1) } : p
            ));
          }
        }
      )
      .subscribe();

    return () => {
      postsChannel.unsubscribe();
      commentsChannel.unsubscribe();
      likesChannel.unsubscribe();
    };
  }, [videoId, user, posts]);

  const createPost = async (text: string) => {
    if (!user || !videoId) return;
    
    // Format: video:videoId:text
    const formattedText = `video:${videoId}:${text}`;
    
    const { data, error } = await supabase
      .from("social_posts")
      .insert({ user_id: user.id, text: formattedText })
      .select("id, user_id, text, likes_count, created_at")
      .single();

    if (error || !data) {
      toast.error("Failed to create post");
      return;
    }

    toast.success("Post published");
    return data;
  };

  const toggleLike = async (post: VideoPost) => {
    if (!user) return;

    if (post.liked) {
      // Unlike
      setLikedPostIds(prev => prev.filter(id => id !== post.id));
      setPosts(prev => prev.map(p => 
        p.id === post.id ? { ...p, liked: false, likes: Math.max(0, p.likes - 1) } : p
      ));

      const { error } = await supabase
        .from("social_post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);

      if (error) {
        // Revert on error
        setLikedPostIds(prev => [...prev, post.id]);
        setPosts(prev => prev.map(p => 
          p.id === post.id ? { ...p, liked: true, likes: p.likes + 1 } : p
        ));
        toast.error("Could not unlike");
      }
    } else {
      // Like
      setLikedPostIds(prev => [...prev, post.id]);
      setPosts(prev => prev.map(p => 
        p.id === post.id ? { ...p, liked: true, likes: p.likes + 1 } : p
      ));

      const { error } = await supabase
        .from("social_post_likes")
        .insert({ post_id: post.id, user_id: user.id });

      if (error && error.code !== "23505") {
        // Revert on error (except duplicate key)
        setLikedPostIds(prev => prev.filter(id => id !== post.id));
        setPosts(prev => prev.map(p => 
          p.id === post.id ? { ...p, liked: false, likes: Math.max(0, p.likes - 1) } : p
        ));
        toast.error("Could not like");
      }
    }
  };

  const addComment = async (postId: string, text: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("social_comments")
      .insert({ post_id: postId, user_id: user.id, text })
      .select("id, post_id, user_id, text, created_at")
      .single();

    if (error || !data) {
      toast.error("Could not add comment");
      return;
    }

    toast.success("Comment added");
    return data;
  };

  const deletePost = async (post: VideoPost) => {
    if (!user || post.userId !== user.id) return;

    const { error } = await supabase
      .from("social_posts")
      .delete()
      .eq("id", post.id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Could not delete post");
      return;
    }

    toast.success("Post deleted");
  };

  const deleteComment = async (comment: VideoComment) => {
    if (!user || comment.userId !== user.id) return;

    const { error } = await supabase
      .from("social_comments")
      .delete()
      .eq("id", comment.id)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Could not delete comment");
      return;
    }

    toast.success("Comment deleted");
  };

  // Get aggregated stats for the video
  const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0);
  const totalComments = comments.length;
  const totalPosts = posts.length;

  return {
    posts,
    comments,
    likedPostIds,
    loading,
    totalLikes,
    totalComments,
    totalPosts,
    createPost,
    toggleLike,
    addComment,
    deletePost,
    deleteComment
  };
}
