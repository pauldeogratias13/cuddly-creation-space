import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import {
  getSocialPosts,
  likePost,
  unlikePost,
  getComments,
  addComment,
  subscribeToPostLikes,
  getProfile,
} from "../supabase";
import { NotificationCreators } from "../notifications";
import type { SocialPost, SocialComment } from "../types";

export function useSocialFeed(initialLimit = 20) {
  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(0);
  const queryClient = useQueryClient();

  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery<SocialPost[]>({
    queryKey: ["social-posts", limit, offset],
    queryFn: async () => (await getSocialPosts(limit, offset)) as unknown as SocialPost[],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const likeMutation = useMutation({
    mutationFn: ({
      postId,
      userId,
      postAuthorId,
      likerUsername,
    }: {
      postId: string;
      userId: string;
      postAuthorId: string;
      likerUsername: string;
    }) => likePost(postId, userId),
    onSuccess: async (data, variables) => {
      // Update the post in cache
      queryClient.setQueryData(["social-posts", limit, offset], (oldPosts: SocialPost[] = []) =>
        oldPosts.map((post) =>
          post.id === variables.postId
            ? { ...post, likes_count: post.likes_count + 1, is_liked: true }
            : post,
        ),
      );

      // Send notification to post author (if not liking own post)
      if (variables.postAuthorId !== variables.userId) {
        try {
          await NotificationCreators.likePost(
            variables.postId,
            variables.postAuthorId,
            variables.userId,
            variables.likerUsername,
          );
        } catch (error) {
          console.error("Error sending like notification:", error);
        }
      }
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      unlikePost(postId, userId),
    onSuccess: (data, variables) => {
      // Update the post in cache
      queryClient.setQueryData(["social-posts", limit, offset], (oldPosts: SocialPost[] = []) =>
        oldPosts.map((post) =>
          post.id === variables.postId
            ? { ...post, likes_count: Math.max(0, post.likes_count - 1), is_liked: false }
            : post,
        ),
      );
    },
  });

  const handleLike = useCallback(
    (postId: string, userId: string) => {
      const post = posts.find((p) => p.id === postId);
      if (post?.is_liked) {
        unlikeMutation.mutate({ postId, userId });
      } else {
        likeMutation.mutate({
          postId,
          userId,
          postAuthorId: post?.user_id ?? userId,
          likerUsername: post?.profile?.username ?? "Someone",
        });
      }
    },
    [posts, likeMutation, unlikeMutation],
  );

  const loadMore = useCallback(() => {
    setOffset((prev) => prev + limit);
  }, [limit]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["social-posts"] });
  }, [queryClient]);

  return {
    posts,
    isLoading,
    error,
    hasNextPage: posts.length >= limit,
    isFetchingNextPage: false,
    handleLike,
    loadMore,
    refresh,
    isLiking: likeMutation.isPending || unlikeMutation.isPending,
  };
}

export function useComments(postId: string) {
  const queryClient = useQueryClient();

  const {
    data: comments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getComments(postId),
    enabled: !!postId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const addCommentMutation = useMutation({
    mutationFn: ({
      content,
      userId,
      postAuthorId,
      commenterUsername,
    }: {
      content: string;
      userId: string;
      postAuthorId: string;
      commenterUsername: string;
    }) => addComment(postId, userId, content),
    onSuccess: async (newComment, variables) => {
      queryClient.setQueryData(["comments", postId], (oldComments: SocialComment[] = []) => [
        ...oldComments,
        newComment,
      ]);

      // Update post comment count
      queryClient.setQueryData(["social-posts"], (oldPosts: SocialPost[] = []) =>
        oldPosts.map((post) =>
          post.id === postId ? { ...post, comments: [...(post.comments || []), newComment] } : post,
        ),
      );

      // Send notification to post author (if not commenting on own post)
      if (variables.postAuthorId !== variables.userId) {
        try {
          await NotificationCreators.commentOnPost(
            postId,
            variables.postAuthorId,
            variables.userId,
            variables.commenterUsername,
            variables.content,
          );
        } catch (error) {
          console.error("Error sending comment notification:", error);
        }
      }
    },
  });

  const handleAddComment = useCallback(
    (content: string, userId: string, postAuthorId = userId, commenterUsername = "Someone") => {
      addCommentMutation.mutate({ content, userId, postAuthorId, commenterUsername });
    },
    [addCommentMutation],
  );

  return {
    comments,
    isLoading,
    error,
    handleAddComment,
    isAddingComment: addCommentMutation.isPending,
  };
}

export function useRealtimePost(postId: string) {
  const queryClient = useQueryClient();

  const subscribeToPostUpdates = useCallback(() => {
    const subscription = subscribeToPostLikes(postId, (payload) => {
      if (payload.eventType === "INSERT") {
        // Post was liked
        queryClient.setQueryData(["social-posts"], (oldPosts: SocialPost[] = []) =>
          oldPosts.map((post) =>
            post.id === postId ? { ...post, likes_count: post.likes_count + 1 } : post,
          ),
        );
      } else if (payload.eventType === "DELETE") {
        // Post was unliked
        queryClient.setQueryData(["social-posts"], (oldPosts: SocialPost[] = []) =>
          oldPosts.map((post) =>
            post.id === postId ? { ...post, likes_count: Math.max(0, post.likes_count - 1) } : post,
          ),
        );
      }
    });

    return () => subscription.unsubscribe();
  }, [postId, queryClient]);

  return {
    subscribeToPostUpdates,
  };
}
