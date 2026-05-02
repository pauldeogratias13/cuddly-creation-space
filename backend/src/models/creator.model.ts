/**
 * Creator monetization domain types
 * Maps to: CreatorTier, CreatorSubscription, CreatorEarning, GatedContent, Tip
 */

export type EarningType = 'SUBSCRIPTION' | 'TIP' | 'GATED_CONTENT' | 'BRAND_DEAL' | 'AD_REVENUE';
export type ContentType = 'POST' | 'VIDEO' | 'ARTICLE' | 'FILE';
export type AccessLevel = 'PUBLIC' | 'SUBSCRIBERS' | 'PAID' | 'CUSTOM';

export interface CreatorTier {
  id: string;
  creatorId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  benefits: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatorSubscription {
  id: string;
  subscriberId: string;
  creatorId: string;
  tierId: string | null;
  active: boolean;
  autoRenew: boolean;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Relations (enriched)
  tier?: CreatorTier | null;
}

export interface CreatorEarning {
  id: string;
  creatorId: string;
  type: EarningType;
  amount: number;
  currency: string;
  description: string | null;
  referenceId: string | null;
  processedAt: Date | null;
  createdAt: Date;
}

export interface Tip {
  id: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency: string;
  message: string | null;
  isAnonymous: boolean;
  stripePaymentIntentId: string | null;
  createdAt: Date;
}

export interface GatedContent {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  contentType: ContentType;
  contentUrl: string | null;
  contentText: string | null;
  thumbnailUrl: string | null;
  accessLevel: AccessLevel;
  price: number | null;
  currency: string;
  isActive: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatorAnalytics {
  subscriberCount: number;
  postCount: number;
  totalViews: number;
  totalEarnings: number;
}

export interface CreateTierInput {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  benefits?: string[];
}

export interface SubscribeInput {
  tierId?: string;
}

export interface SendTipInput {
  toUserId: string;
  amount: number;
  currency?: string;
  message?: string;
  isAnonymous?: boolean;
}
