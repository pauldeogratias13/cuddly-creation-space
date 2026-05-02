/**
 * Media domain types — maps to Media in Prisma
 */

export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';

export interface MediaAsset {
  id: string;
  userId: string;
  type: MediaType;
  url: string;
  cdnUrl: string | null;
  thumbnailUrl: string | null;
  mimeType: string | null;
  size: number | null;   // bytes
  width: number | null;
  height: number | null;
  duration: number | null; // seconds (video/audio)
  altText: string | null;
  createdAt: Date;
}

export interface UploadResult {
  id: string;
  url: string;
  type: MediaType;
  mimeType: string | null;
  size: number | null;
}
