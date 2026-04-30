import { View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView } from "react-native";
import { useState } from "react";
import { useAuth } from "@nexus/shared";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

type IconName = ComponentProps<typeof Ionicons>["name"];
type CreateOption = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

export default function CreateScreen() {
  const { user } = useAuth();
  const [postText, setPostText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const createOptions: CreateOption[] = [
    {
      icon: "camera-outline",
      label: "Take Photo",
      onPress: () => handleImagePicker("camera"),
    },
    {
      icon: "videocam-outline",
      label: "Record Video",
      onPress: () => router.push("/create/video"),
    },
    {
      icon: "document-text-outline",
      label: "Write Post",
      onPress: () => {},
    },
    {
      icon: "musical-notes-outline",
      label: "Add Music",
      onPress: () => {},
    },
    {
      icon: "location-outline",
      label: "Add Location",
      onPress: () => {},
    },
    {
      icon: "people-outline",
      label: "Tag People",
      onPress: () => {},
    },
  ];

  const handleImagePicker = async (type: "camera" | "library") => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handlePost = async () => {
    if (!postText.trim() && !selectedImage) {
      Alert.alert("Error", "Please add some content to your post");
      return;
    }

    if (!user) {
      Alert.alert("Error", "Please sign in to create a post");
      return;
    }

    setIsPosting(true);
    try {
      // TODO: Implement actual post creation logic
      console.log("Creating post:", { text: postText, image: selectedImage });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert("Success", "Post created successfully!");
      setPostText("");
      setSelectedImage(null);
      router.push("/(tabs)");
    } catch (error) {
      Alert.alert("Error", "Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-8">
        <Ionicons name="create-outline" size={64} color="#9CA3AF" />
        <Text className="text-gray-500 text-center mt-4">Please sign in to create content</Text>
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
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Create Post</Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={isPosting || (!postText.trim() && !selectedImage)}
            className={`px-4 py-1 rounded-full ${
              postText.trim() || selectedImage ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <Text className={`text-white font-medium ${isPosting ? "opacity-50" : ""}`}>
              {isPosting ? "Posting..." : "Post"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Post Input */}
        <View className="flex-row items-start">
          <Image
            source={{ uri: "https://api.dicebear.com/7.x/identicon/svg?seed=" + user.id }}
            className="w-10 h-10 rounded-full mr-3"
          />
          <TextInput
            value={postText}
            onChangeText={setPostText}
            placeholder="What's on your mind?"
            placeholderTextColor="#9CA3AF"
            multiline
            className="flex-1 text-gray-900 text-base"
            style={{ minHeight: 80 }}
            textAlignVertical="top"
          />
        </View>

        {/* Selected Image */}
        {selectedImage && (
          <View className="mt-4">
            <Image
              source={{ uri: selectedImage }}
              className="w-full h-48 rounded-lg"
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-black bg-opacity-60 p-2 rounded-full"
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Creation Options */}
      <View className="bg-white mt-2 p-4">
        <Text className="text-gray-500 text-sm mb-4">Add to your post</Text>
        <View className="grid grid-cols-3 gap-4">
          {createOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={option.onPress}
              className="items-center p-4 bg-gray-50 rounded-lg"
            >
              <Ionicons name={option.icon} size={32} color="#666" />
              <Text className="text-xs text-gray-600 mt-2 text-center">{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View className="bg-white mt-2 p-4">
        <Text className="text-gray-500 text-sm mb-4">Quick Actions</Text>
        <View className="space-y-3">
          <TouchableOpacity className="flex-row items-center p-3 bg-gray-50 rounded-lg">
            <Ionicons name="camera-outline" size={24} color="#666" />
            <Text className="ml-3 text-gray-900">Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-3 bg-gray-50 rounded-lg">
            <Ionicons name="videocam-outline" size={24} color="#666" />
            <Text className="ml-3 text-gray-900">Record Video</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center p-3 bg-gray-50 rounded-lg">
            <Ionicons name="mic-outline" size={24} color="#666" />
            <Text className="ml-3 text-gray-900">Record Audio</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
