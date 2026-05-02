import { View, Text, ScrollView, TouchableOpacity, Image, FlatList, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { useAuth, useCreatorProfile, useGatedContent, followUser, unfollowUser, supabase } from "@nexus/shared";
import { Ionicons } from "@expo/vector-icons";
import type { CreatorTier } from "@nexus/shared";

export default function ProfileViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "videos" | "gated">("posts");

  const {
    profile,
    tiers,
    subscription,
    stats,
    creatorPosts,
    creatorVideos,
    isLoading,
    error,
    subscribe,
    tip,
    isSubscribing,
    isTipping,
  } = useCreatorProfile(id ?? "") as any;

  const { content: gatedContent } = useGatedContent(id ?? "") as any;

  useEffect(() => {
    const loadFollowStatus = async () => {
      if (!user || !id) return;
      const { data } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", id)
        .single();

      setIsFollowing(!!data);
    };

    loadFollowStatus();
  }, [id, user]);

  const handleFollow = async () => {
    if (!user || !id) return router.push("/auth");
    if (isFollowing) {
      await unfollowUser(user.id, id);
      setIsFollowing(false);
      return;
    }

    await followUser(user.id, id);
    setIsFollowing(true);
  };

  const handleSubscribe = (tier: CreatorTier) => {
    if (!user) return router.push("/auth");

    subscribe({ tierId: tier.id });
  };

  const handleTip = () => {
    if (!user) return router.push("/auth");

    Alert.alert(
      "Send a Tip",
      "Choose an amount to tip",
      [
        { text: "$1", onPress: () => tip({ amount: 1, message: "Thanks for your great work!" }) },
        { text: "$5", onPress: () => tip({ amount: 5, message: "Thanks for your great work!" }) },
        { text: "$10", onPress: () => tip({ amount: 10, message: "Thanks for your great work!" }) },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const renderPost = ({ item }: { item: any }) => (
    <View className="bg-white border-b border-gray-200 p-4">
      <Text className="text-gray-900 mb-2">{item.text}</Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-4">
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="heart-outline" size={20} color="#666" />
            <Text className="ml-1 text-gray-600 text-sm">{item.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="chatbubble-outline" size={20} color="#666" />
            <Text className="ml-1 text-gray-600 text-sm">{item.comments?.length || 0}</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 text-xs">
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const renderVideo = ({ item }: { item: any }) => (
    <View className="bg-white border-b border-gray-200 p-4">
      <TouchableOpacity
        onPress={() => router.push(`/video/${item.id}`)}
        className="mb-3"
      >
        <Image
          source={{ uri: item.thumbnail_url || "https://via.placeholder.com/400x225" }}
          className="w-full h-48 rounded-lg"
          resizeMode="cover"
        />
        <Text className="font-semibold text-gray-900 mt-2">{item.title}</Text>
        <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>{item.description}</Text>
      </TouchableOpacity>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-4">
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="heart-outline" size={20} color="#666" />
            <Text className="ml-1 text-gray-600 text-sm">0</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center">
            <Ionicons name="eye-outline" size={20} color="#666" />
            <Text className="ml-1 text-gray-600 text-sm">1.2k</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 text-xs">
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Ionicons name="person-outline" size={64} color="#9CA3AF" />
        <Text className="text-gray-500 mt-4">Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="flex-row items-center mb-4">
          <Image
            source={{
              uri: profile.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`
            }}
            className="w-20 h-20 rounded-full mr-4"
          />
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">{profile.username}</Text>
            {stats?.reputation_score && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                <Text className="ml-1 text-sm text-green-600">
                  {stats.reputation_score >= 90 ? "Elite" : stats.reputation_score >= 70 ? "Expert" : "Rising"} Creator
                </Text>
              </View>
            )}
            <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>{profile.bio}</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-around mb-4">
          <View className="items-center">
            <Text className="text-lg font-bold text-gray-900">{stats?.posts_count || 0}</Text>
            <Text className="text-xs text-gray-500">Posts</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold text-gray-900">{stats?.followers_count || 0}</Text>
            <Text className="text-xs text-gray-500">Followers</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold text-gray-900">{stats?.total_likes || 0}</Text>
            <Text className="text-xs text-gray-500">Likes</Text>
          </View>
          <View className="items-center">
            <Text className="text-lg font-bold text-gray-900">{stats?.total_views || 0}</Text>
            <Text className="text-xs text-gray-500">Views</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={handleFollow}
            className={`flex-1 py-2 rounded-lg ${isFollowing ? 'bg-gray-200' : 'bg-blue-500'}`}
          >
            <Text className={`text-center font-semibold ${isFollowing ? 'text-gray-700' : 'text-white'}`}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleTip}
            className="px-4 py-2 bg-green-500 rounded-lg"
          >
            <Ionicons name="heart" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subscription Tiers */}
      {!subscription?.active && tiers?.length > 0 && (
        <View className="bg-white mx-4 mt-4 rounded-lg border border-gray-200 p-4">
          <Text className="text-lg font-semibold mb-3">Support {profile.username}</Text>
          {tiers.slice(0, 2).map((tier) => (
            <TouchableOpacity
              key={tier.id}
              onPress={() => handleSubscribe(tier)}
              className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg mb-2"
            >
              <View>
                <Text className="font-semibold">{tier.name}</Text>
                <Text className="text-sm text-gray-600">${tier.price}/month</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-gray-500">{tier.benefits?.length ?? 0} perks</Text>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content Tabs */}
      <View className="flex-row bg-white border-b border-gray-200 mt-4">
        {[
          { key: "posts", label: "Posts", count: creatorPosts?.length ?? 0 },
          { key: "videos", label: "Videos", count: creatorVideos?.length ?? 0 },
          { key: "gated", label: "Gated", count: gatedContent?.length ?? 0 }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 ${activeTab === tab.key ? 'border-b-2 border-blue-500' : ''}`}
          >
            <Text className={`text-center font-semibold ${activeTab === tab.key ? 'text-blue-500' : 'text-gray-600'}`}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === "posts" && (
        <FlatList<any>
          data={creatorPosts ?? []}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}

      {activeTab === "videos" && (
        <FlatList<any>
          data={creatorVideos ?? []}
          renderItem={renderVideo}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}

      {activeTab === "gated" && (
        <View className="p-8 items-center">
          {subscription?.active ? (
            <View>
              <Ionicons name="lock-open" size={48} color="#10B981" />
              <Text className="text-lg font-semibold mt-4">Exclusive Content</Text>
              <Text className="text-gray-600 text-center mt-2">
                {`You have access to ${gatedContent?.length ?? 0} gated items.`}
              </Text>
            </View>
          ) : (
            <View>
              <Ionicons name="lock-closed" size={48} color="#9CA3AF" />
              <Text className="text-lg font-semibold mt-4">Subscriber-Only Content</Text>
              <Text className="text-gray-600 text-center mt-2">
                Subscribe to access exclusive content from {profile.username}.
              </Text>
              <TouchableOpacity
                onPress={() => tiers?.[0] && handleSubscribe(tiers[0])}
                className="mt-4 bg-blue-500 px-6 py-2 rounded-full"
              >
                <Text className="text-white font-semibold">Subscribe</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}