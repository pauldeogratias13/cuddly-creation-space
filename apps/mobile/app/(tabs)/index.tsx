import { View, Text, FlatList, RefreshControl, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { useState, useCallback } from "react";
import { useSocialFeed, INTENT_META, COMMUNITY_SPACES, type SocialPost, type IntentMode } from "@nexus/shared";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function HomeScreen() {
  const {
    posts, stories, isLoading, error, handleLike, handleBookmark, votePoll,
    loadMore, refresh, isLiking, intent, setIntent, anonMode, setAnonMode
  } = useSocialFeed();
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
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="font-semibold text-gray-900">
                {item.profile?.username || "Anonymous"}
              </Text>
              {item.is_anonymous && <Ionicons name="eye-off" size={14} color="#666" className="ml-1" />}
              {item.reputation_score && item.reputation_score >= 50 && (
                <View className="ml-2 px-1.5 py-0.5 rounded bg-blue-100">
                  <Text className="text-xs text-blue-700 font-medium">
                    {item.reputation_score >= 90 ? "Elite" : item.reputation_score >= 70 ? "Expert" : "Notable"}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-xs text-gray-500">
              {new Date(item.created_at).toLocaleDateString()}
              {item.intent_tag && ` · ${INTENT_META[item.intent_tag].emoji} ${INTENT_META[item.intent_tag].label}`}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Text className="text-gray-900 mb-3">{item.text}</Text>

      {/* Poll */}
      {item.poll && (
        <View className="mb-3 p-3 bg-gray-50 rounded-lg">
          {item.poll.options.map((option, idx) => {
            const percentage = item.poll!.total > 0 ? (option.votes / item.poll!.total) * 100 : 0;
            const isVoted = item.poll!.voted_option === option.id;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => votePoll(item.id, option.id)}
                className={`mb-2 p-2 rounded ${isVoted ? 'bg-blue-100' : 'bg-white'}`}
              >
                <View className="flex-row items-center justify-between">
                  <Text className={`flex-1 ${isVoted ? 'font-semibold' : ''}`}>{option.label}</Text>
                  <Text className="text-sm text-gray-500">{option.votes} ({percentage.toFixed(0)}%)</Text>
                </View>
                <View className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
          <Text className="text-xs text-gray-500 mt-2">
            {item.poll.total} votes · {item.poll.ends_at ? `Ends ${new Date(item.poll.ends_at).toLocaleDateString()}` : 'Ongoing'}
          </Text>
        </View>
      )}

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
        <TouchableOpacity onPress={() => handleBookmark(item.id)}>
          <Ionicons
            name={item.is_bookmarked ? "bookmark" : "bookmark-outline"}
            size={24}
            color={item.is_bookmarked ? "#F59E0B" : "#666"}
          />
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
      {/* Intent Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white border-b border-gray-200">
        <View className="flex-row p-3">
          {(Object.entries(INTENT_META) as [IntentMode, typeof INTENT_META[IntentMode]][]).map(([mode, meta]) => {
            const active = intent === mode;
            return (
              <TouchableOpacity
                key={mode}
                onPress={() => setIntent(mode)}
                className={`mr-3 px-4 py-2 rounded-full border ${active ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-300'}`}
              >
                <Text className={`text-sm font-semibold ${active ? 'text-blue-700' : 'text-gray-700'}`}>
                  {meta.emoji} {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Stories Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white border-b border-gray-200">
        <View className="flex-row p-3">
          {stories.slice(0, 10).map((story) => (
            <TouchableOpacity key={story.id} className="mr-4 items-center">
              <View className="w-14 h-14 rounded-full border-2 border-blue-500 p-0.5">
                <Image
                  source={{
                    uri: story.author?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${story.author?.handle || 'anon'}`
                  }}
                  className="w-full h-full rounded-full"
                />
              </View>
              <Text className="text-xs text-gray-600 mt-1 w-14 text-center" numberOfLines={1}>
                {story.author?.display_name || story.author?.handle || 'User'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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
