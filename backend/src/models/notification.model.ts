/**
 * Notification domain types — maps to Notification in Prisma
 */

export type NotificationType =
  | 'LIKE'
  | 'COMMENT'
  | 'FOLLOW'
  | 'MENTION'
  | 'REPOST'
  | 'SUBSCRIBE'
  | 'TIP'
  | 'SYSTEM'
  | 'MODERATION';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  actionUrl: string | null;
  actorId: string | null;
  resourceId: string | null;
  readAt: Date | null;
  createdAt: Date;
  // Enriched
  actor?: {
    id: string;
    profile: {
      handle: string;
      avatarUrl: string | null;
      displayName: string | null;
    } | null;
  } | null;
}

export interface NotificationPage {
  data: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
