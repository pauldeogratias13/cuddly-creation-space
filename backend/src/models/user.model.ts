/**
 * User domain types — mirrors Prisma models but safe to expose via API
 * (no password hashes, secrets, etc.)
 */

export interface PublicProfile {
  id: string;
  userId: string;
  handle: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  location: string | null;
  verified: boolean;
  isCreator: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  reputationScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicUser {
  id: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile: PublicProfile | null;
}

export type UserRole = 'USER' | 'CREATOR' | 'MODERATOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED' | 'PENDING_VERIFICATION';

export interface FollowRelation {
  followerId: string;
  followingId: string;
  createdAt: Date;
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  website?: string;
  location?: string;
  avatarUrl?: string;
  coverUrl?: string;
}
