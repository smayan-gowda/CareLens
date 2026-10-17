/**
 * Storage Service
 * Handles uploading images to Supabase Storage,
 * preserving full original quality with hosted CDN URLs.
 */

import { uploadToSupabaseStorage, deleteFromSupabaseStorage, isSupabaseConfigured } from "@/utils/supabaseStorage";
import { compressImageDataUrl } from "@/utils/imageCompression";
import { toast } from "sonner";

export { isSupabaseConfigured };

export async function deleteImageFromStorage(url: string, bucketName = "room-photos"): Promise<void> {
  if (!url || typeof url !== "string") return;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    if (isSupabaseConfigured()) {
      await deleteFromSupabaseStorage(url, bucketName);
    }
  }
}

export async function processImageForStorage(
  fileOrUrl: File | string,
  oldUrlToDelete?: string
): Promise<string> {
  if (!fileOrUrl) return "";

  // Delete previous photo if a replacement is provided
  if (
    oldUrlToDelete &&
    typeof oldUrlToDelete === "string" &&
    oldUrlToDelete !== fileOrUrl &&
    (oldUrlToDelete.startsWith("http://") || oldUrlToDelete.startsWith("https://"))
  ) {
    deleteImageFromStorage(oldUrlToDelete).catch((e) =>
      console.warn("Failed to delete old replaced image:", e)
    );
  }

  if (typeof fileOrUrl === "string") {
    if (fileOrUrl.startsWith("http://") || fileOrUrl.startsWith("https://")) {
      return fileOrUrl;
    }
  }

  // 1. Primary: Upload to Supabase Storage (100% free, full original resolution)
  if (isSupabaseConfigured()) {
    try {
      const publicUrl = await uploadToSupabaseStorage(fileOrUrl, "room-photos");
      if (publicUrl && publicUrl.startsWith("http")) {
        return publicUrl;
      }
    } catch (err: any) {
      console.warn("Supabase Storage upload error:", err);
      toast.error(`Supabase upload error: ${err?.message || "Check storage bucket & API keys"}`);
    }
  } else {
    console.warn("Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not detected in environment.");
  }

  // 2. Local compressed base64 fallback (guarantees Firestore documents stay well under 1MB limit)
  let rawBase64 = "";
  if (fileOrUrl instanceof File) {
    rawBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(fileOrUrl);
    });
  } else {
    rawBase64 = fileOrUrl;
  }

  if (!rawBase64) return "";

  // Highly compressed local base64 fallback (~70KB) so Firestore write size is never exceeded if Supabase is offline
  return compressImageDataUrl(rawBase64, 800, 800, 0.65, 70, true);
}

export interface StorageMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export const storageService = {
  async uploadImage(
    path: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<string> {
    if (onProgress) onProgress(30);
    const url = await processImageForStorage(file);
    if (onProgress) onProgress(100);
    return url;
  },

  async deleteImage(pathOrUrl: string): Promise<void> {
    await deleteImageFromStorage(pathOrUrl);
  },

  async getImages(path: string): Promise<string[]> {
    return Promise.resolve([]);
  },

  async updateMetadata(path: string, metadata: Partial<StorageMetadata>): Promise<void> {
    return Promise.resolve();
  }
};
