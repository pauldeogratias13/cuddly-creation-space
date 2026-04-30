import { View, Text, FlatList, TouchableOpacity, Image, ScrollView } from "react-native";
import { useState, useEffect, useCallback } from "react";
import type { ComponentProps } from "react";
import { useAuth, type Notification } from "@nexus/shared";
import { NotificationService, NotificationHandlers } from "@nexus/shared";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type IconName = ComponentProps<typeof Ionicons>["name"];
type NotificationType = Notification["type"];
type NotificationRouteKey = "post_id" | "chat_thread_id" | "video_id";

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [notificationsData, unreadData] = await Promise.all([
        NotificationService.getNotifications(user.id),
        NotificationService.getUnreadCount(user.id),
      ]);

      setNotifications(notificationsData);
      setUnreadCount(unreadData);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Load notifications
    loadNotifications();

    // Set up notification handlers
    NotificationHandlers.setupNotificationHandlers();

    // Register for push notifications
    NotificationHandlers.registerForPushNotifications(user.id);

    // Subscribe to real-time notifications
    const subscription = NotificationService.subscribeToNotifications(
      user.id,
      (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadNotifications, user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await NotificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (!notifications.find((n) => n.id === notificationId)?.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getStringDataValue = (notification: Notification, key: NotificationRouteKey) => {
    const value = notification.data?.[key];
    return typeof value === "string" ? value : null;
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case "like":
      case "comment":
      case "mention":
      case "post_shared":
        {
          const postId = getStringDataValue(notification, "post_id");
          if (postId) {
            router.push(`/post/${postId}`);
          }
        }
        break;
      case "follow":
      case "follow_request":
        if (notification.actor_id) {
          router.push(`/profile/${notification.actor_id}`);
        }
        break;
      case "chat_message":
        {
          const chatThreadId = getStringDataValue(notification, "chat_thread_id");
          if (chatThreadId) {
            router.push(`/chat/${chatThreadId}`);
          }
        }
        break;
      case "video_like":
      case "video_comment":
        {
          const videoId = getStringDataValue(notification, "video_id");
          if (videoId) {
            router.push(`/video/${videoId}`);
          }
        }
        break;
      case "profile_view":
        if (notification.actor_id) {
          router.push(`/profile/${notification.actor_id}`);
        }
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: NotificationType): IconName => {
    const icons: Record<NotificationType, IconName> = {
      like: "heart",
      comment: "chatbubble",
      follow: "person-add",
      mention: "at",
      chat_message: "chatbubble",
      post_shared: "share",
      profile_view: "eye",
      video_like: "heart",
      video_comment: "chatbubble",
      follow_request: "person-add",
      system: "information-circle",
    };
    return icons[type] || "notifications";
  };

  const getNotificationColor = (type: NotificationType) => {
    const colors: Record<NotificationType, string> = {
      like: "#EF4444",
      comment: "#3B82F6",
      follow: "#10B981",
      mention: "#8B5CF6",
      chat_message: "#F59E0B",
      post_shared: "#6366F1",
      profile_view: "#9CA3AF",
      video_like: "#EF4444",
      video_comment: "#3B82F6",
      follow_request: "#10B981",
      system: "#6B7280",
    };
    return colors[type] || "#6B7280";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      className={`bg-white border-b border-gray-200 p-4 ${!item.is_read ? "bg-blue-50" : ""}`}
    >
      <View className="flex-row items-start">
        {/* Icon */}
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: getNotificationColor(item.type) + "20" }}
        >
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={20}
            color={getNotificationColor(item.type)}
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-semibold text-gray-900 flex-1">{item.title}</Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-500 mr-2">{formatTime(item.created_at)}</Text>
              {!item.is_read && <View className="w-2 h-2 bg-blue-500 rounded-full" />}
            </View>
          </View>

          <Text className="text-gray-600 text-sm mb-2">{item.message}</Text>

          {/* Actor info */}
          {item.actor && (
            <View className="flex-row items-center">
              <Image
                source={{
                  uri:
                    item.actor.avatar_url ||
                    "https://api.dicebear.com/7.x/identicon/svg?seed=" + item.actor.username,
                }}
                className="w-6 h-6 rounded-full mr-2"
              />
              <Text className="text-xs text-gray-500">
                {item.actor.full_name || item.actor.username}
              </Text>
            </View>
          )}
        </View>

        {/* Delete button */}
        <TouchableOpacity onPress={() => deleteNotification(item.id)} className="p-2">
          <Ionicons name="close" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center p-8">
      <Ionicons name="notifications-off-outline" size={64} color="#9CA3AF" />
      <Text className="text-gray-500 text-center mt-4">
        No notifications yet. When people interact with your content, you'll see it here!
      </Text>
    </View>
  );

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-8">
        <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
        <Text className="text-gray-500 text-center mt-4">
          Please sign in to view your notifications
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/auth")}
          className="mt-4 bg-blue-500 px-6 py-2 rounded-full"
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 p-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Text className="text-2xl font-bold text-gray-900">Notifications</Text>
            {unreadCount > 0 && (
              <View className="ml-2 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center">
                <Text className="text-white text-xs font-medium">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text className="text-blue-500 text-sm font-medium">Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-4">
            <TouchableOpacity className="px-4 py-2 bg-blue-500 rounded-full">
              <Text className="text-white text-sm font-medium">All</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-4 py-2 bg-gray-100 rounded-full">
              <Text className="text-gray-700 text-sm font-medium">Unread</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-4 py-2 bg-gray-100 rounded-full">
              <Text className="text-gray-700 text-sm font-medium">Likes</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-4 py-2 bg-gray-100 rounded-full">
              <Text className="text-gray-700 text-sm font-medium">Comments</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-4 py-2 bg-gray-100 rounded-full">
              <Text className="text-gray-700 text-sm font-medium">Follows</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshing={isLoading}
        onRefresh={loadNotifications}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
