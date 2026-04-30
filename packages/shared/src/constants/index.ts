// App Constants
export const APP_NAME = 'NEXUS';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'The World\'s First True Super-App';

// API Constants
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || '';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || process.env.EXPO_PUBLIC_WS_URL || '';

// Supabase Constants
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  LAST_LOGIN: 'last_login',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  APP_VERSION: 'app_version',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  DEFAULT_OFFSET: 0,
  MAX_LIMIT: 100,
} as const;

// File Upload
export const UPLOAD = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'],
  ALLOWED_FILE_TYPES: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf', 'text/plain',
  ],
} as const;

// Social Media Limits
export const SOCIAL_LIMITS = {
  MAX_POST_LENGTH: 2000,
  MAX_COMMENT_LENGTH: 1000,
  MAX_USERNAME_LENGTH: 30,
  MAX_BIO_LENGTH: 160,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

// Chat Limits
export const CHAT_LIMITS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_GROUP_NAME_LENGTH: 50,
  MAX_GROUP_MEMBERS: 100,
  MESSAGE_RETENTION_DAYS: 365,
} as const;

// Validation Patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/.+/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  FORBIDDEN: 'You don\'t have permission to perform this action.',
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  OFFLINE: 'You appear to be offline. Some features may not be available.',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed limit.',
  INVALID_FILE_TYPE: 'File type is not supported.',
  QUOTA_EXCEEDED: 'You have exceeded your quota limit.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully.',
  POST_CREATED: 'Post created successfully.',
  POST_DELETED: 'Post deleted successfully.',
  FOLLOW_SUCCESS: 'User followed successfully.',
  UNFOLLOW_SUCCESS: 'User unfollowed successfully.',
  MESSAGE_SENT: 'Message sent successfully.',
  COMMENT_ADDED: 'Comment added successfully.',
  LIKE_ADDED: 'Like added successfully.',
  LIKE_REMOVED: 'Like removed successfully.',
  FILE_UPLOADED: 'File uploaded successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
  MESSAGE: 'message',
  SYSTEM: 'system',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  FILE: 'file',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Theme Options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Languages
export const LANGUAGES = {
  EN: 'en',
  ES: 'es',
  FR: 'fr',
  DE: 'de',
  IT: 'it',
  PT: 'pt',
  RU: 'ru',
  JA: 'ja',
  KO: 'ko',
  ZH: 'zh',
} as const;

// Time Zones
export const TIME_ZONES = {
  UTC: 'UTC',
  EST: 'America/New_York',
  PST: 'America/Los_Angeles',
  GMT: 'Europe/London',
  CET: 'Europe/Paris',
  JST: 'Asia/Tokyo',
  AEST: 'Australia/Sydney',
} as const;

// Cache Durations (in seconds)
export const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
} as const;

// Rate Limits
export const RATE_LIMITS = {
  POSTS_PER_HOUR: 10,
  COMMENTS_PER_HOUR: 50,
  LIKES_PER_HOUR: 100,
  MESSAGES_PER_MINUTE: 30,
  UPLOADS_PER_HOUR: 5,
  LOGIN_ATTEMPTS: 5,
} as const;

// Feature Flags
export const FEATURES = {
  PUSH_NOTIFICATIONS: 'push_notifications',
  CAMERA_ACCESS: 'camera_access',
  FILE_UPLOAD: 'file_upload',
  OFFLINE_MODE: 'offline_mode',
  BIOMETRIC_AUTH: 'biometric_auth',
  DARK_MODE: 'dark_mode',
  MULTIPLE_LANGUAGES: 'multiple_languages',
  REAL_TIME_CHAT: 'real_time_chat',
  VIDEO_CALLS: 'video_calls',
  PAYMENTS: 'payments',
} as const;

// Platform Specific
export const PLATFORMS = {
  WEB: 'web',
  IOS: 'ios',
  ANDROID: 'android',
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  XS: 0,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;

// Animation Durations
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

// Z-Index values
export const Z_INDEX = {
  BASE: 0,
  DROPDOWN: 1000,
  STICKY: 1100,
  MODAL: 1200,
  POPOVER: 1300,
  TOOLTIP: 1400,
  TOAST: 1500,
  LOADING: 1600,
} as const;

// Colors (CSS Custom Properties)
export const CSS_COLORS = {
  PRIMARY: 'var(--color-primary)',
  SECONDARY: 'var(--color-secondary)',
  SUCCESS: 'var(--color-success)',
  WARNING: 'var(--color-warning)',
  ERROR: 'var(--color-error)',
  INFO: 'var(--color-info)',
  BACKGROUND: 'var(--color-background)',
  SURFACE: 'var(--color-surface)',
  TEXT: 'var(--color-text)',
  TEXT_MUTED: 'var(--color-text-muted)',
  BORDER: 'var(--color-border)',
} as const;

// Default Values
export const DEFAULTS = {
  AVATAR: 'https://api.dicebear.com/7.x/identicon/svg?seed=default',
  THUMBNAIL: '/images/default-thumbnail.jpg',
  LOADING_SKELETON: true,
  AUTO_PLAY: false,
  NOTIFICATIONS_ENABLED: true,
  THEME: THEMES.SYSTEM,
  LANGUAGE: LANGUAGES.EN,
  TIMEZONE: TIME_ZONES.UTC,
} as const;

// External URLs
export const EXTERNAL_URLS = {
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_SERVICE: '/terms-of-service',
  SUPPORT: '/support',
  HELP_CENTER: '/help',
  BLOG: '/blog',
  STATUS: '/status',
} as const;

// Social Links
export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/nexus',
  FACEBOOK: 'https://facebook.com/nexus',
  INSTAGRAM: 'https://instagram.com/nexus',
  LINKEDIN: 'https://linkedin.com/company/nexus',
  YOUTUBE: 'https://youtube.com/@nexus',
  GITHUB: 'https://github.com/nexus',
} as const;

// Development Constants
export const DEV_CONFIG = {
  ENABLE_LOGGING: process.env.NODE_ENV === 'development',
  ENABLE_DEBUG_MODE: process.env.NODE_ENV === 'development',
  MOCK_API: process.env.NODE_ENV === 'development',
  SKIP_AUTH: process.env.NODE_ENV === 'development',
} as const;
