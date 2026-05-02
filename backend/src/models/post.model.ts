/**
 * Post domain types
 */

export type PostType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'POLL' | 'ARTICLE' | 'STORY' | 'REEL';
export type PostVisibility = 'PUBLIC' | 'FOLLOWERS' | 'SUBSCRIBERS' | 'PRIVATE';
export type IntentMode = 'all' | 'learn' | 'chill' | 'explore' | 'create' | 'shop';

export interface PostMedia {
  id: string;
  postId: string;
  mediaId: string;
  order: number;
  media: MediaAsset;
}

export interface MediaAsset {
  id: string;
  userId: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  url: string;
  cdnUrl: string | null;
  thumbnailUrl: string | null;
  mimeType: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  altText: string | null;
  createdAt: Date;
}

export interface PollOption {
  id: string;
  pollId: string;
  label: string;
  votesCount: number;
  order: number;
}

export interface Poll {
  id: string;
  postId: string;
  userId: string;
  question: string;
  endsAt: Date | null;
  totalVotes: number;
  options: PollOption[];
  userVote?: string | null; // optionId the current user voted
}

export interface Post {
  id: string;
  userId: string;
  type: PostType;
  text: string | null;
  visibility: PostVisibility;
  intentTag: IntentMode | null;
  domainTag: string | null;
  isAnonymous: boolean;
  isPinned: boolean;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  viewsCount: number;
  bookmarksCount: number;
  forkParentId: string | null;
  forkDepth: number;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  // Enriched
  isLiked?: boolean;
  isBookmarked?: boolean;
  media?: PostMedia[];
  poll?: Poll | null;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  text: string;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  replies?: Comment[];
}

export interface CreatePostInput {
  type?: PostType;
  text?: string;
  visibility?: PostVisibility;
  intentTag?: IntentMode;
  domainTag?: string;
  isAnonymous?: boolean;
  mediaIds?: string[];
  scheduledAt?: string;
  poll?: {
    question: string;
    options: string[];
    endsAt?: string;
  };
  forkParentId?: string;
}
