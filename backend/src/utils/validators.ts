import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Handle can only contain letters, numbers, and underscores'),
  displayName: z.string().min(1).max(60).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1),
});

// ─── User ─────────────────────────────────────────────────────────────────────

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(60).optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  location: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
});

export const UpdateHandleSchema = z.object({
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
});

// ─── Posts ────────────────────────────────────────────────────────────────────

export const CreatePostSchema = z.object({
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'POLL', 'ARTICLE', 'STORY', 'REEL']).default('TEXT'),
  text: z.string().min(1).max(2000).optional(),
  visibility: z.enum(['PUBLIC', 'FOLLOWERS', 'SUBSCRIBERS', 'PRIVATE']).default('PUBLIC'),
  intentTag: z.enum(['all', 'learn', 'chill', 'explore', 'create', 'shop']).optional(),
  domainTag: z.string().max(50).optional(),
  isAnonymous: z.boolean().default(false),
  mediaIds: z.array(z.string().uuid()).max(10).optional(),
  scheduledAt: z.string().datetime().optional(),
  poll: z.object({
    question: z.string().min(1).max(280),
    options: z.array(z.string().min(1).max(80)).min(2).max(6),
    endsAt: z.string().datetime().optional(),
  }).optional(),
  forkParentId: z.string().uuid().optional(),
}).refine(
  (data) => data.type !== 'TEXT' || (data.text && data.text.length > 0),
  { message: 'Text is required for TEXT posts' }
);

export const UpdatePostSchema = z.object({
  text: z.string().min(1).max(2000).optional(),
  visibility: z.enum(['PUBLIC', 'FOLLOWERS', 'SUBSCRIBERS', 'PRIVATE']).optional(),
});

export const CreateCommentSchema = z.object({
  text: z.string().min(1).max(1000),
  parentId: z.string().uuid().optional(),
});

// ─── Messages ─────────────────────────────────────────────────────────────────

export const CreateThreadSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1).max(99),
  title: z.string().max(100).optional(),
  isGroup: z.boolean().default(false),
  message: z.string().max(2000).optional(),
});

export const SendMessageSchema = z.object({
  text: z.string().min(1).max(2000).optional(),
  mediaUrl: z.string().url().optional(),
  replyToId: z.string().uuid().optional(),
}).refine(
  (data) => data.text || data.mediaUrl,
  { message: 'Message must have text or media' }
);

// ─── Commerce ─────────────────────────────────────────────────────────────────

export const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  price: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  stock: z.number().int().min(0).default(0),
  category: z.string().max(50).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const AddToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100).default(1),
});

export const CreateOrderSchema = z.object({
  productIds: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
  })),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  }).optional(),
  notes: z.string().max(500).optional(),
});

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// ─── Reports ─────────────────────────────────────────────────────────────────

export const CreateReportSchema = z.object({
  reportedUserId: z.string().uuid().optional(),
  postId: z.string().uuid().optional(),
  reason: z.enum(['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'MISINFORMATION', 'NUDITY', 'VIOLENCE', 'COPYRIGHT', 'OTHER']),
  description: z.string().max(1000).optional(),
}).refine(
  (data) => data.reportedUserId || data.postId,
  { message: 'Must report either a user or a post' }
);

// ─── Creator ─────────────────────────────────────────────────────────────────

export const CreateTierSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(500).optional(),
  price: z.number().min(0),
  currency: z.string().length(3).default('USD'),
  benefits: z.array(z.string()).max(20).optional(),
});

export const SendTipSchema = z.object({
  toUserId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  message: z.string().max(280).optional(),
  isAnonymous: z.boolean().default(false),
});
