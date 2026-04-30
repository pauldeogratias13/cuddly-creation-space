import { View, Text, FlatList, RefreshControl, TouchableOpacity, Image } from "react-native";
import { useState, useCallback } from "react";
import { useSocialFeed, type SocialPost } from "@nexus/shared";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function HomeScreen() {
  const { posts, isLoading, error, handleLike, loadMore, refresh, isLiking } = useSocialFeed();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderPost = ({ item }: { item: SocialPost }) => (
    <View className="bg-white border-b border-gray-200 p-4">
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <TouchableOpacity
          onPress={() => router.push(`/profile/${item.profile?.id}`)}
          className="flex-row items-center flex-1"
        >
          <Image
            source={{
              uri:
                item.profile?.avatar_url ||
                "https://api.dicebear.com/7.x/identicon/svg?seed=" + item.profile?.username,
            }}
            className="w-10 h-10 rounded-full mr-3"
          />
          <View>
            <Text className="font-semibold text-gray-900">
              {item.profile?.username || "Anonymous"}
            </Text>
            <Text className="text-xs text-gray-500">
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text className="text-gray-900 mb-3">{item.text}</Text>

      {/* Video Preview */}
      {item.video && (
        <TouchableOpacity
          onPress={() => item.video && router.push(`/video/${item.video.id}`)}
          className="mb-3"
        >
          <View className="relative">
            <Image
              source={{ uri: item.video.thumbnail_url || "https://via.placeholder.com/400x225" }}
              className="w-full h-48 rounded-lg"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black bg-opacity-30 rounded-lg items-center justify-center">
              <Ionicons name="play-circle" size={60} color="white" />
            </View>
            <View className="absolute bottom-2 right-2 bg-black bg-opacity-60 px-2 py-1 rounded">
              <Text className="text-white text-xs">
                {Math.floor(item.video.duration / 60)}:
                {(item.video.duration % 60).toString().padStart(2, "0")}
              </Text>
            </View>
          </View>
          <Text className="font-semibold text-gray-900 mt-2">{item.video.title}</Text>
          {item.video.description && (
            <Text className="text-gray-600 text-sm mt-1">{item.video.description}</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View className="flex-row items-center justify-between mt-4">
        <View className="flex-row items-center space-x-4">
          <TouchableOpacity
            onPress={() => item.profile && handleLike(item.id, item.profile.id)}
            className="flex-row items-center"
            disabled={isLiking}
          >
            <Ionicons
              name={item.is_liked ? "heart" : "heart-outline"}
              size={24}
              color={item.is_liked ? "#EF4444" : "#666"}
            />
            <Text className="ml-1 text-gray-600">{item.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/post/${item.id}`)}
            className="flex-row items-center"
          >
            <Ionicons name="chatbubble-outline" size={24} color="#666" />
            <Text className="ml-1 text-gray-600">{item.comments?.length || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="share-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center p-8">
      <Ionicons name="home-outline" size={64} color="#9CA3AF" />
      <Text className="text-gray-500 text-center mt-4">
        No posts yet. Start following people to see their content here!
      </Text>
    </View>
  );

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-red-500 text-center mt-4">Something went wrong</Text>
        <TouchableOpacity onPress={refresh} className="mt-4 bg-blue-500 px-6 py-2 rounded-full">
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
