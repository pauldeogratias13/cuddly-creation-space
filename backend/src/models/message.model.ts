/**
 * Messaging domain types — maps to Thread / ThreadParticipant / Message in Prisma
 */

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'DELETED';

export interface Thread {
  id: string;
  title: string | null;
  isGroup: boolean;
  isEncrypted: boolean;
  avatarUrl: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  participants: ThreadParticipant[];
  lastMessage?: Message | null;
  unreadCount?: number;
}

export interface ThreadParticipant {
  threadId: string;
  userId: string;
  isPinned: boolean;
  isMuted: boolean;
  isAdmin: boolean;
  lastReadAt: Date | null;
  joinedAt: Date;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  text: string | null;
  mediaUrl: string | null;
  replyToId: string | null;
  status: MessageStatus;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  replyTo?: Message | null;
}

export interface SendMessageInput {
  text?: string;
  mediaUrl?: string;
  replyToId?: string;
}

export interface CreateThreadInput {
  participantIds: string[];
  title?: string;
  isGroup?: boolean;
  message?: string;
}
