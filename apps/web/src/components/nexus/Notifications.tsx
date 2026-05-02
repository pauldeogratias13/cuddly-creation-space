/**
 * Notifications.tsx - Social interaction notification system
 * Handles likes, comments, follows, mentions, and other social notifications
 */
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Hash, X, Check, Eye } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export type NotificationType = "like" | "comment" | "follow" | "mention" | "post_in_space" | "trending";

export interface Notification {
  id: string;
  type: NotificationType;
  actor: {
    id: string;
    handle: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  target: {
    id: string;
    type: "post" | "comment" | "space" | "user";
    content?: string;
  };
  message: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationsProps {
  notifications?: Notification[];
  onMarkRead?: (notificationId: string) => Promise<void>;
  onMarkAllRead?: () => Promise<void>;
  maxItems?: number;
}

export function NotificationBell({ 
  notifications = [], 
  onMarkRead 
}: { 
  notifications?: Notification[];
  onMarkRead?: (id: string) => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    if (!notification.is_read) {
      await onMarkRead?.(notification.id);
    }
    // Handle navigation to target (post, profile, etc.)
    setIsOpen(false);
  }, [onMarkRead]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-surface/50 transition-colors"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50"
          >
            <NotificationList
              notifications={notifications}
              onNotificationClick={handleNotificationClick}
              onClose={() => setIsOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function NotificationList({ 
  notifications, 
  onNotificationClick, 
  onClose,
  showHeader = true 
}: { 
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onClose?: () => void;
  showHeader?: boolean;
}) {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <Bell className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No notifications yet</p>
      </div>
    );
  }

  return (
    <>
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="text-sm font-semibold">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 text-xs text-primary">
                {unreadCount} unread
              </span>
            )}
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className="max-h-96 overflow-y-auto">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClick={() => onNotificationClick(notification)}
          />
        ))}
      </div>
    </>
  );
}

function NotificationItem({ 
  notification, 
  onClick 
}: { 
  notification: Notification;
  onClick: () => void;
}) {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-pink-500" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "mention":
        return <AtSign className="h-4 w-4 text-purple-500" />;
      case "post_in_space":
        return <Hash className="h-4 w-4 text-orange-500" />;
      case "trending":
        return <Eye className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <motion.button
      whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
      onClick={onClick}
      className={`w-full flex items-start gap-3 p-4 text-left hover:bg-surface/50 transition-colors ${
        !notification.is_read ? "bg-primary/5 border-l-2 border-primary" : ""
      }`}
    >
      <div className="relative shrink-0">
        {getIcon(notification.type)}
        {!notification.is_read && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <img
            src={notification.actor.avatar_url || `https://api.dicebear.com/8.x/identicon/svg?seed=${notification.actor.handle || 'default'}&backgroundColor=0f172a`}
            alt={notification.actor.display_name || notification.actor.handle}
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="text-xs font-semibold text-foreground">
            {notification.actor.display_name || notification.actor.handle}
          </span>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {formatTimeAgo(notification.created_at)}
        </p>
      </div>
    </motion.button>
  );
}

// Notification settings panel
export function NotificationSettings() {
  const [settings, setSettings] = useState({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    posts_in_spaces: true,
    trending_posts: false,
  });

  const handleToggle = useCallback((key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Notification Preferences</h3>
      
      <div className="space-y-3">
        <label className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            <span className="text-sm">Likes</span>
          </div>
          <input
            type="checkbox"
            checked={settings.likes}
            onChange={() => handleToggle("likes")}
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-500" />
            <span className="text-sm">Comments</span>
          </div>
          <input
            type="checkbox"
            checked={settings.comments}
            onChange={() => handleToggle("comments")}
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-green-500" />
            <span className="text-sm">New followers</span>
          </div>
          <input
            type="checkbox"
            checked={settings.follows}
            onChange={() => handleToggle("follows")}
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AtSign className="h-4 w-4 text-purple-500" />
            <span className="text-sm">Mentions</span>
          </div>
          <input
            type="checkbox"
            checked={settings.mentions}
            onChange={() => handleToggle("mentions")}
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-orange-500" />
            <span className="text-sm">Posts in spaces</span>
          </div>
          <input
            type="checkbox"
            checked={settings.posts_in_spaces}
            onChange={() => handleToggle("posts_in_spaces")}
            className="rounded"
          />
        </label>

        <label className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-red-500" />
            <span className="text-sm">Trending posts</span>
          </div>
          <input
            type="checkbox"
            checked={settings.trending_posts}
            onChange={() => handleToggle("trending_posts")}
            className="rounded"
          />
        </label>
      </div>
    </div>
  );
}

// Notification feed component for dedicated notifications page
export function NotificationFeed({ 
  notifications, 
  onMarkRead, 
  onMarkAllRead 
}: NotificationsProps) {
  const [filter, setFilter] = useState<NotificationType | "all">("all");
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = filter === "all" 
    ? notifications 
    : notifications.filter(n => n.type === filter);

  const handleMarkAllRead = useCallback(async () => {
    await onMarkAllRead?.();
    toast.success("All notifications marked as read");
  }, [onMarkAllRead]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-primary hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-surface text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        
        {(["like", "comment", "follow", "mention", "post_in_space", "trending"] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 ${
              filter === type
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {getIconForType(type)}
            {type.charAt(0).toUpperCase() + type.slice(1).replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Notifications */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {filter === "all" ? "No notifications yet" : `No ${filter.replace("_", " ")} notifications`}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => onMarkRead?.(notification.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Helper functions
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getIconForType(type: NotificationType) {
  switch (type) {
    case "like":
      return <Heart className="h-3 w-3 text-pink-500" />;
    case "comment":
      return <MessageCircle className="h-3 w-3 text-blue-500" />;
    case "follow":
      return <UserPlus className="h-3 w-3 text-green-500" />;
    case "mention":
      return <AtSign className="h-3 w-3 text-purple-500" />;
    case "post_in_space":
      return <Hash className="h-3 w-3 text-orange-500" />;
    case "trending":
      return <Eye className="h-3 w-3 text-red-500" />;
    default:
      return <Bell className="h-3 w-3 text-muted-foreground" />;
  }
}
