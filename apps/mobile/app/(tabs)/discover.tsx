import { View, Text, FlatList, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All', icon: 'grid-outline' },
    { id: 'trending', label: 'Trending', icon: 'trending-up-outline' },
    { id: 'videos', label: 'Videos', icon: 'videocam-outline' },
    { id: 'photos', label: 'Photos', icon: 'image-outline' },
    { id: 'music', label: 'Music', icon: 'musical-notes-outline' },
    { id: 'articles', label: 'Articles', icon: 'document-text-outline' },
  ];

  const trendingTopics = [
    { id: '1', name: '#Technology', posts: 1234, color: '#3B82F6' },
    { id: '2', name: '#Design', posts: 892, color: '#8B5CF6' },
    { id: '3', name: '#Startup', posts: 756, color: '#10B981' },
    { id: '4', name: '#AI', posts: 2341, color: '#F59E0B' },
    { id: '5', name: '#Web3', posts: 567, color: '#EF4444' },
    { id: '6', name: '#Mobile', posts: 445, color: '#6366F1' },
  ];

  const suggestedUsers = [
    {
      id: '1',
      username: 'techguru',
      full_name: 'Tech Guru',
      bio: 'Tech enthusiast & developer',
      avatar_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=techguru',
      followers_count: 12500,
      is_following: false,
    },
    {
      id: '2',
      username: 'designqueen',
      full_name: 'Sarah Design',
      bio: 'UI/UX Designer | Creative Mind',
      avatar_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=designqueen',
      followers_count: 8900,
      is_following: true,
    },
    {
      id: '3',
      username: 'startupfounder',
      full_name: 'Mike Startup',
      bio: 'Building the future, one startup at a time',
      avatar_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=startupfounder',
      followers_count: 15600,
      is_following: false,
    },
  ];

  const discoverContent = [
    {
      id: '1',
      type: 'video',
      title: 'Amazing Tech Review 2024',
      thumbnail: 'https://via.placeholder.com/300x200',
      author: 'techguru',
      likes: 4521,
      views: '12.3K',
      duration: '10:24',
    },
    {
      id: '2',
      type: 'photo',
      title: 'Beautiful Sunset Photography',
      thumbnail: 'https://via.placeholder.com/300x300',
      author: 'photolover',
      likes: 2341,
      views: '8.7K',
    },
    {
      id: '3',
      type: 'article',
      title: 'The Future of Web Development',
      thumbnail: 'https://via.placeholder.com/300x200',
      author: 'webdev',
      likes: 892,
      views: '3.2K',
      read_time: '5 min read',
    },
    {
      id: '4',
      type: 'music',
      title: 'Chill Vibes Playlist',
      thumbnail: 'https://via.placeholder.com/300x300',
      author: 'musicmaker',
      likes: 567,
      views: '2.1K',
      duration: '45:32',
    },
  ];

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => setActiveCategory(item.id)}
      className={`items-center p-3 rounded-lg mr-3 ${
        activeCategory === item.id ? 'bg-blue-500' : 'bg-gray-100'
      }`}
    >
      <Ionicons
        name={item.icon as any}
        size={24}
        color={activeCategory === item.id ? 'white' : '#666'}
      />
      <Text className={`text-xs mt-1 ${
        activeCategory === item.id ? 'text-white' : 'text-gray-600'
      }`}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderTopic = ({ item }: { item: any }) => (
    <TouchableOpacity className="bg-gray-50 rounded-lg p-3 mr-3 mb-3">
      <Text className="font-semibold text-gray-900" style={{ color: item.color }}>
        {item.name}
      </Text>
      <Text className="text-xs text-gray-500 mt-1">{item.posts} posts</Text>
    </TouchableOpacity>
  );

  const renderUser = ({ item }: { item: any }) => (
    <View className="bg-white border border-gray-200 rounded-lg p-4 mr-3 mb-3" style={{ width: 200 }}>
      <View className="flex-row items-center mb-3">
        <Image
          source={{ uri: item.avatar_url }}
          className="w-12 h-12 rounded-full mr-3"
        />
        <View className="flex-1">
          <Text className="font-semibold text-gray-900">{item.username}</Text>
          <Text className="text-xs text-gray-500">{item.followers_count.toLocaleString()} followers</Text>
        </View>
      </View>
      <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
        {item.bio}
      </Text>
      <TouchableOpacity
        className={`py-2 rounded-lg ${
          item.is_following
            ? 'bg-gray-200 border border-gray-300'
            : 'bg-blue-500'
        }`}
      >
        <Text className={`text-center font-medium text-sm ${
          item.is_following ? 'text-gray-700' : 'text-white'
        }`}>
          {item.is_following ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = ({ item }: { item: any }) => (
    <TouchableOpacity className="bg-white rounded-lg overflow-hidden mr-3 mb-3" style={{ width: 200 }}>
      <View className="relative">
        <Image
          source={{ uri: item.thumbnail }}
          className="w-full h-32"
          resizeMode="cover"
        />
        {item.type === 'video' && (
          <View className="absolute bottom-2 right-2 bg-black bg-opacity-60 px-2 py-1 rounded">
            <Text className="text-white text-xs">{item.duration}</Text>
          </View>
        )}
        {item.type === 'video' && (
          <View className="absolute inset-0 items-center justify-center">
            <Ionicons name="play-circle" size={40} color="white" />
          </View>
        )}
        {item.type === 'article' && (
          <View className="absolute top-2 right-2 bg-blue-500 px-2 py-1 rounded">
            <Text className="text-white text-xs">{item.read_time}</Text>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="font-semibold text-gray-900 text-sm mb-1" numberOfLines={2}>
          {item.title}
        </Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-gray-500">@{item.author}</Text>
          <Text className="text-xs text-gray-500">{item.views}</Text>
        </View>
        <View className="flex-row items-center mt-2">
          <Ionicons name="heart-outline" size={14} color="#666" />
          <Text className="text-xs text-gray-500 ml-1">{item.likes.toLocaleString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Search Bar */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search content, users, topics..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 text-gray-900"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View className="bg-white p-4 border-b border-gray-200">
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Trending Topics */}
      <View className="bg-white p-4 mb-2">
        <Text className="font-semibold text-gray-900 mb-3">Trending Topics</Text>
        <FlatList
          data={trendingTopics}
          renderItem={renderTopic}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Suggested Users */}
      <View className="bg-white p-4 mb-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-semibold text-gray-900">Suggested for You</Text>
          <TouchableOpacity>
            <Text className="text-blue-500 text-sm">See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={suggestedUsers}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Discover Content */}
      <View className="bg-white p-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-semibold text-gray-900">Discover Content</Text>
          <TouchableOpacity>
            <Text className="text-blue-500 text-sm">See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={discoverContent}
          renderItem={renderContent}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>
    </ScrollView>
  );
}
