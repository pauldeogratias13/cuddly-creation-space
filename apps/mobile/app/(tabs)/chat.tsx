import { View, Text, FlatList, TouchableOpacity, Image, TextInput } from "react-native";
import { useState } from "react";
import { useAuth } from "@nexus/shared";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type ChatProfile = {
  username: string;
  full_name: string;
  avatar_url: string;
};

type ChatThreadItem = {
  id: string;
  title: string;
  is_group: boolean;
  last_message: {
    content: string;
    created_at: string;
  };
  unread_count: number;
  profile?: ChatProfile;
  profiles?: ChatProfile[];
};

export default function ChatScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock chat threads data
  const chatThreads: ChatThreadItem[] = [
    {
      id: "1",
      title: "Sarah Johnson",
      is_group: false,
      last_message: {
        content: "Hey! How are you doing?",
        created_at: new Date(Date.now() - 300000).toISOString(),
      },
      unread_count: 2,
      profile: {
        username: "sarahj",
        full_name: "Sarah Johnson",
        avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=sarah",
      },
    },
    {
      id: "2",
      title: "Tech Team",
      is_group: true,
      last_message: {
        content: "Meeting at 3pm today",
        created_at: new Date(Date.now() - 900000).toISOString(),
      },
      unread_count: 5,
      profiles: [
        {
          username: "alex",
          full_name: "Alex Chen",
          avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=alex",
        },
        {
          username: "maria",
          full_name: "Maria Garcia",
          avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=maria",
        },
      ],
    },
    {
      id: "3",
      title: "Mike Wilson",
      is_group: false,
      last_message: {
        content: "Thanks for the help!",
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      unread_count: 0,
      profile: {
        username: "mikew",
        full_name: "Mike Wilson",
        avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=mike",
      },
    },
    {
      id: "4",
      title: "Design Squad",
      is_group: true,
      last_message: {
        content: "New mockups are ready",
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      unread_count: 1,
      profiles: [
        {
          username: "emma",
          full_name: "Emma Davis",
          avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=emma",
        },
        {
          username: "john",
          full_name: "John Smith",
          avatar_url: "https://api.dicebear.com/7.x/identicon/svg?seed=john",
        },
      ],
    },
  ];

  const filteredThreads = chatThreads.filter((thread) =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

  const renderThread = ({ item }: { item: ChatThreadItem }) => (
    <TouchableOpacity
      onPress={() => router.push(`/chat/${item.id}`)}
      className="bg-white border-b border-gray-200 p-4"
    >
      <View className="flex-row items-center">
        {/* Avatar(s) */}
        <View className="mr-3">
          {item.is_group ? (
            <View className="flex-row">
              {item.profiles?.slice(0, 2).map((profile, index) => (
                <Image
                  key={profile.username}
                  source={{ uri: profile.avatar_url }}
                  className={`w-10 h-10 rounded-full border-2 border-white ${
                    index === 1 ? "-ml-2" : ""
                  }`}
                />
              ))}
              {item.profiles?.length > 2 && (
                <View className="w-10 h-10 rounded-full bg-gray-300 border-2 border-white -ml-2 items-center justify-center">
                  <Text className="text-xs text-gray-600">+{item.profiles.length - 2}</Text>
                </View>
              )}
            </View>
          ) : (
            <Image
              source={{
                uri:
                  item.profile?.avatar_url ||
                  "https://api.dicebear.com/7.x/identicon/svg?seed=default",
              }}
              className="w-12 h-12 rounded-full"
            />
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-semibold text-gray-900 flex-1">{item.title}</Text>
            <Text className="text-xs text-gray-500">
              {formatTime(item.last_message.created_at)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-600 text-sm flex-1" numberOfLines={1}>
              {item.last_message.content}
            </Text>
            {item.unread_count > 0 && (
              <View className="bg-blue-500 rounded-full min-w-[20px] h-5 items-center justify-center ml-2">
                <Text className="text-white text-xs font-medium">
                  {item.unread_count > 99 ? "99+" : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center p-8">
      <Ionicons name="chatbubble-outline" size={64} color="#9CA3AF" />
      <Text className="text-gray-500 text-center mt-4">
        No conversations yet. Start chatting with people!
      </Text>
    </View>
  );

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-8">
        <Ionicons name="chatbubble-outline" size={64} color="#9CA3AF" />
        <Text className="text-gray-500 text-center mt-4">
          Please sign in to view your conversations
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
          <Text className="text-2xl font-bold text-gray-900">Messages</Text>
          <TouchableOpacity>
            <Ionicons name="create-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 text-gray-900"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredThreads}
        renderItem={renderThread}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
