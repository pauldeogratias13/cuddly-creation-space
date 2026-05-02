/**
 * storage.ts - Media upload and management utilities
 * Handles image/video uploads for social posts, stories, and profiles
 */
import { supabase } from "@/integrations/supabase/client";

export type UploadType = "post" | "story" | "profile" | "space";

export interface UploadOptions {
  file: File;
  type: UploadType;
  userId: string;
  metadata?: Record<string, any>;
}

export interface UploadResult {
  url: string;
  path: string;
  publicUrl: string;
}

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
  post: 10 * 1024 * 1024, // 10MB
  story: 15 * 1024 * 1024, // 15MB
  profile: 5 * 1024 * 1024, // 5MB
  space: 5 * 1024 * 1024, // 5MB
};

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  image: [
    "image/jpeg",
    "image/png", 
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  video: [
    "video/mp4",
    "video/webm",
    "video/ogg",
  ],
};

/**
 * Validate file before upload
 */
function validateFile(file: File, type: UploadType): { valid: boolean; error?: string } {
  // Check file size
  const maxSize = FILE_SIZE_LIMITS[type];
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
    };
  }

  // Check MIME type
  const allAllowedTypes = [...ALLOWED_MIME_TYPES.image, ...ALLOWED_MIME_TYPES.video];
  if (!allAllowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "File type not supported. Please upload an image or video file.",
    };
  }

  return { valid: true };
}

/**
 * Generate a unique file path for storage
 */
function generateFilePath(type: UploadType, userId: string, file: File): string {
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const fileName = `${timestamp}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
  
  return `${type}s/${userId}/${fileName}`;
}

/**
 * Upload a file to Supabase storage
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const { file, type, userId, metadata = {} } = options;

  // Validate file
  const validation = validateFile(file, type);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate file path
  const filePath = generateFilePath(type, userId, file);

  try {
    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("social-media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        metadata: {
          ...metadata,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        },
      });

    if (error) {
      console.error("Upload error:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("social-media")
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Failed to generate public URL");
    }

    return {
      url: publicUrlData.publicUrl,
      path: filePath,
      publicUrl: publicUrlData.publicUrl,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

/**
 * Delete a file from Supabase storage
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from("social-media")
      .remove([path]);

    if (error) {
      console.error("Delete error:", error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
}

/**
 * Upload multiple files (for posts with multiple images)
 */
export async function uploadMultipleFiles(
  files: File[],
  type: UploadType,
  userId: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => 
    uploadFile({ file, type, userId })
  );

  try {
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    // If any upload fails, clean up successful uploads
    console.error("Multiple upload error:", error);
    throw error;
  }
}

/**
 * Get file info from Supabase storage
 */
export async function getFileInfo(path: string) {
  try {
    const { data, error } = await supabase.storage
      .from("social-media")
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop(),
      });

    if (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }

    return data?.[0] || null;
  } catch (error) {
    console.error("Get file info error:", error);
    throw error;
  }
}

/**
 * Compress image before upload (client-side)
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a thumbnail for video files
 */
export async function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      video.currentTime = 1; // Seek to 1 second
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(video.src);
      resolve(thumbnailUrl);
    };

    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return ALLOWED_MIME_TYPES.image.includes(file.type);
}

/**
 * Check if a file is a video
 */
export function isVideoFile(file: File): boolean {
  return ALLOWED_MIME_TYPES.video.includes(file.type);
}
