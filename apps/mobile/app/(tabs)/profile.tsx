import { View, Text, ScrollView, TouchableOpacity, Image, FlatList } from "react-native";
import { useState, useEffect } from "react";
import { useAuth } from "@nexus/shared";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { router } from "expo-router";

type IconName = ComponentProps<typeof Ionicons>["name"];
type MenuItem = {
  icon: IconName;
  label: string;
  onPress: () => void | Promise<void>;
};
type ProfilePost = {
  id: string;
  text: string;
  likes_count: number;
  created_at: string;
};

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");

  const menuItems: MenuItem[] = [
    { icon: "settings-outline", label: "Settings", onPress: () => router.push("/settings") },
    { icon: "person-add-outline", label: "Invite Friends", onPress: () => {} },
    { icon: "help-circle-outline", label: "Help & Support", onPress: () => {} },
    { icon: "log-out-outline", label: "Sign Out", onPress: signOut },
  ];

  const stats = [
    { label: "Posts", value: profile?.posts_count || 0 },
    { label: "Followers", value: profile?.followers_count || 0 },
    { label: "Following", value: profile?.following_count || 0 },
    { label: "Likes", value: profile?.total_likes || 0 },
  ];

  const mockPosts: ProfilePost[] = [
    {
      id: "1",
      text: "Just launched our new app! 🚀",
      likes_count: 42,
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      text: "Beautiful sunset today 🌅",
      likes_count: 28,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "3",
      text: "Working on something exciting...",
      likes_count: 15,
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  const renderPost = ({ item }: { item: ProfilePost }) => (
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
            <Text className="ml-1 text-gray-600 text-sm">0</Text>
          </TouchableOpacity>
        </View>
        <Text className="text-gray-500 text-xs">
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  if (!user || !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Ionicons name="person-outline" size={64} color="#9CA3AF" />
        <Text className="text-gray-500 mt-4">Please sign in to view your profile</Text>
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
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="flex-row items-center mb-4">
          <Image
            source={{
              uri:
                profile.avatar_url ||
                "https://api.dicebear.com/7.x/identicon/svg?seed=" + profile.username,
            }}
            className="w-20 h-20 rounded-full mr-4"
          />
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">{profile.username}</Text>
            <Text className="text-gray-600">{profile.full_name}</Text>
            {profile.bio && <Text className="text-gray-600 mt-1 text-sm">{profile.bio}</Text>}
          </View>
          <TouchableOpacity onPress={() => router.push("/profile/edit")} className="p-2">
            <Ionicons name="create-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row justify-around py-4 border-y border-gray-200">
          {stats.map((stat, index) => (
            <View key={index} className="items-center">
              <Text className="text-xl font-bold text-gray-900">{stat.value}</Text>
              <Text className="text-xs text-gray-500">{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex-row">
          <TouchableOpacity
            onPress={() => setActiveTab("posts")}
            className={`flex-1 py-3 border-b-2 ${
              activeTab === "posts" ? "border-blue-500" : "border-transparent"
            }`}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === "posts" ? "text-blue-500" : "text-gray-500"
              }`}
            >
              Posts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("likes")}
            className={`flex-1 py-3 border-b-2 ${
              activeTab === "likes" ? "border-blue-500" : "border-transparent"
            }`}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === "likes" ? "text-blue-500" : "text-gray-500"
              }`}
            >
              Likes
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {activeTab === "posts" ? (
        <FlatList
          data={mockPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListEmptyComponent={
            <View className="p-8 items-center">
              <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No posts yet</Text>
            </View>
          }
        />
      ) : (
        <View className="p-8 items-center">
          <Ionicons name="heart-outline" size={48} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2">No liked posts yet</Text>
        </View>
      )}

      {/* Menu */}
      <View className="bg-white mt-4 border-t border-gray-200">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={item.onPress}
            className={`flex-row items-center p-4 ${
              index < menuItems.length - 1 ? "border-b border-gray-100" : ""
            }`}
          >
            <Ionicons name={item.icon} size={24} color="#666" />
            <Text className="ml-3 text-gray-900 flex-1">{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
