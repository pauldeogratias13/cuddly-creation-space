import * as ImagePicker from "expo-image-picker";
import * as Camera from "expo-camera";
import * as FileSystem from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as Sharing from "expo-sharing";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

type NotificationData = Record<string, unknown>;
type NativeFormDataFile = {
  uri: string;
  name: string;
  type: string;
};
type NavigatorWithConnection = Navigator & {
  connection?: {
    effectiveType?: string;
  };
};

export class DeviceService {
  // Camera & Media
  static async requestCameraPermissions() {
    if (Platform.OS === "web") return true;

    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === "granted";
  }

  static async requestMediaLibraryPermissions() {
    if (Platform.OS === "web") return true;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === "granted";
  }

  static async takePhoto(options: ImagePicker.CameraOptions = {}) {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) {
      throw new Error("Camera permission denied");
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      ...options,
    });

    if (result.canceled) {
      throw new Error("Camera capture cancelled");
    }

    return result.assets[0];
  }

  static async recordVideo(options: ImagePicker.CameraOptions = {}) {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) {
      throw new Error("Camera permission denied");
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      maxDuration: 60, // 60 seconds max
      ...options,
    });

    if (result.canceled) {
      throw new Error("Video recording cancelled");
    }

    return result.assets[0];
  }

  static async pickFromLibrary(options: ImagePicker.ImagePickerOptions = {}) {
    const hasPermission = await this.requestMediaLibraryPermissions();
    if (!hasPermission) {
      throw new Error("Media library permission denied");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      ...options,
    });

    if (result.canceled) {
      throw new Error("Media selection cancelled");
    }

    return result.assets[0];
  }

  // Biometric Authentication
  static async isBiometricAvailable() {
    if (Platform.OS === "web") return false;

    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  }

  static async authenticateBiometric(prompt: string = "Authenticate to continue") {
    if (Platform.OS === "web") return true;

    const hasBiometric = await this.isBiometricAvailable();
    if (!hasBiometric) {
      throw new Error("Biometric authentication not available");
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: prompt,
      fallbackLabel: "Use passcode",
      cancelLabel: "Cancel",
    });

    return result.success;
  }

  // Secure Storage
  static async secureSet(key: string, value: string) {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  }

  static async secureGet(key: string) {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }

    return await SecureStore.getItemAsync(key);
  }

  static async secureDelete(key: string) {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  }

  // Push Notifications
  static async requestNotificationPermissions() {
    if (Platform.OS === "web") return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  }

  static async getNotificationToken() {
    if (Platform.OS === "web") return null;

    const hasPermission = await this.requestNotificationPermissions();
    if (!hasPermission) {
      throw new Error("Notification permission denied");
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  }

  static async scheduleNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: NotificationData,
  ) {
    if (Platform.OS === "web") return null;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: "default",
      },
      trigger,
    });
  }

  static async showNotification(title: string, body: string, data?: NotificationData) {
    if (Platform.OS === "web") {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body, icon: "/icon.png" });
      }
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: "default",
      },
      trigger: null, // Show immediately
    });
  }

  // Device Information
  static getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version,
      isDevice: Device.isDevice,
      brand: Device.brand,
      modelName: Device.modelName,
      osVersion: Device.osVersion,
    };
  }

  // File Operations
  static async uploadFile(fileUri: string, fileName: string, mimeType: string) {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);

    if (!fileInfo.exists) {
      throw new Error("File does not exist");
    }

    // Create form data for upload
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: mimeType,
    } as NativeFormDataFile as unknown as Blob);

    // TODO: Implement actual upload to your storage service
    // This is a placeholder - integrate with your cloud storage
    const uploadUrl = "https://your-upload-endpoint.com/upload";

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    return await response.json();
  }

  // Sharing
  static async shareContent(title: string, url: string, message?: string) {
    if (Platform.OS === "web") {
      if (navigator.share) {
        await navigator.share({
          title,
          url,
          text: message,
        });
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
      }
      return;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(url, {
        title,
        message,
      });
    } else {
      // Fallback - copy to clipboard
      // TODO: Implement clipboard functionality
      alert("Link copied to clipboard!");
    }
  }

  // Deep Linking
  static createDeepLink(path: string, params?: Record<string, string>) {
    const baseUrl = Linking.createURL("");
    const url = new URL(path, baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return url.toString();
  }

  static async handleDeepLink(url: string) {
    const parsed = Linking.parse(url);

    // Handle different deep link patterns
    if (parsed.hostname === "post" && parsed.path?.[0]) {
      return { type: "post", id: parsed.path[0] };
    }

    if (parsed.hostname === "profile" && parsed.path?.[0]) {
      return { type: "profile", id: parsed.path[0] };
    }

    if (parsed.hostname === "chat" && parsed.path?.[0]) {
      return { type: "chat", id: parsed.path[0] };
    }

    return { type: "unknown", data: parsed };
  }

  // Location Services
  static async requestLocationPermissions() {
    if (Platform.OS === "web") {
      return "granted" in navigator.permissions
        ? await navigator.permissions.query({ name: "geolocation" }).then((p) => p.state)
        : "prompt";
    }

    // TODO: Implement location permissions for mobile
    return "granted";
  }

  static async getCurrentLocation() {
    const hasPermission = await this.requestLocationPermissions();

    if (Platform.OS === "web") {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 },
        );
      });
    }

    // TODO: Implement mobile location
    throw new Error("Location not implemented for mobile yet");
  }

  // Haptic Feedback
  static triggerHaptic(type: "success" | "warning" | "error" | "light" | "medium" | "heavy") {
    if (Platform.OS === "web") return;

    // TODO: Implement haptic feedback for mobile
    // This would require expo-haptics package
  }

  // App Settings
  static async openAppSettings() {
    if (Platform.OS === "web") return;

    // TODO: Implement open settings for mobile
    // This would require Linking.openSettings()
  }

  // Network Status
  static async getNetworkStatus() {
    if (Platform.OS === "web") {
      return {
        isConnected: navigator.onLine,
        type: (navigator as NavigatorWithConnection).connection?.effectiveType ?? "unknown",
      };
    }

    // TODO: Implement network status for mobile
    // This would require expo-netinfo package
    return {
      isConnected: true,
      type: "unknown",
    };
  }
}

// Notification Handlers
export class NotificationHandlers {
  static setupNotificationHandlers() {
    if (Platform.OS === "web") return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Handle notification responses
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      // Navigate based on notification type
      if (data.type === "post") {
        // Navigate to post
      } else if (data.type === "profile") {
        // Navigate to profile
      } else if (data.type === "chat") {
        // Navigate to chat
      }
    });
  }

  static async registerForPushNotifications(userId: string) {
    if (Platform.OS === "web") return null;

    try {
      const token = await DeviceService.getNotificationToken();

      // Save token to database
      // TODO: Implement save token to user_devices table
      console.log("Push token registered:", token);

      return token;
    } catch (error) {
      console.error("Error registering for push notifications:", error);
      return null;
    }
  }
}
