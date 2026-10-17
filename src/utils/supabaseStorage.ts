import { createClient } from "@supabase/supabase-js";

/**
 * Supabase Storage Integration
 *
 * Supabase provides 100% free image hosting (up to 50MB per file, 5GB total)
 * without requiring any credit card to sign up.
 *
 * 1. Create a free account at https://supabase.com (no credit card needed)
 * 2. Create a new project and go to Storage -> New Bucket -> Name it "room-photos" (toggle "Public bucket" ON)
 * 3. Copy your API URL and anon Key from Project Settings -> API
 * 4. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment
 */

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key);
}

let supabaseInstance: any = null;

function getSupabaseClient() {
  if (supabaseInstance) return supabaseInstance;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase credentials. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment."
    );
  }

  supabaseInstance = createClient(url, key, {
    auth: { persistSession: false }
  });
  return supabaseInstance;
}

export async function uploadToSupabaseStorage(
  fileOrBase64: File | string,
  bucketName = "room-photos"
): Promise<string> {
  const supabase = getSupabaseClient();
  const fileId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let uploadData: File | Blob;
  let fileExtension = "jpg";

  if (fileOrBase64 instanceof File) {
    uploadData = fileOrBase64;
    fileExtension = fileOrBase64.name.split(".").pop() || "jpg";
  } else {
    // Base64 string conversion
    const match = fileOrBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType = match ? match[1] : "image/jpeg";
    fileExtension = mimeType.split("/")[1] || "jpg";

    const base64Data = fileOrBase64.replace(/^data:image\/\w+;base64,/, "");
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    uploadData = new Blob([byteArray], { type: mimeType });
  }

  const filePath = `${fileId}.${fileExtension}`;

  let { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, uploadData, {
      cacheControl: "3600",
      upsert: true,
    });

  // If upload failed because the bucket doesn't exist yet, attempt to create it automatically
  if (error && (error.message?.toLowerCase().includes("not found") || error.message?.toLowerCase().includes("bucket"))) {
    try {
      await supabase.storage.createBucket(bucketName, { public: true });
      const retry = await supabase.storage
        .from(bucketName)
        .upload(filePath, uploadData, {
          cacheControl: "3600",
          upsert: true,
        });
      error = retry.error;
    } catch {
      // Ignore bucket creation exception and use original error
    }
  }

  if (error) {
    if (error.message?.toLowerCase().includes("row-level security") || error.message?.toLowerCase().includes("rls")) {
      throw new Error(
        `Supabase Storage RLS Error: Row-level security blocked upload. Run this SQL in your Supabase SQL Editor:\n\nINSERT INTO storage.buckets (id, name, public) VALUES ('${bucketName}', '${bucketName}', true) ON CONFLICT (id) DO UPDATE SET public = true;\n\nDROP POLICY IF EXISTS "Allow Public Uploads" ON storage.objects;\nCREATE POLICY "Allow Public Uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = '${bucketName}');\n\nDROP POLICY IF EXISTS "Allow Public Select" ON storage.objects;\nCREATE POLICY "Allow Public Select" ON storage.objects FOR SELECT TO public USING (bucket_id = '${bucketName}');`
      );
    }
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export async function deleteFromSupabaseStorage(
  fileUrl: string,
  bucketName = "room-photos"
): Promise<boolean> {
  if (!fileUrl || typeof fileUrl !== "string") return false;
  if (!isSupabaseConfigured()) return false;

  try {
    const supabase = getSupabaseClient();
    
    // Extract relative path from URL
    // Public URL format: .../storage/v1/object/public/{bucketName}/{filePath}
    let filePath = "";
    const publicPrefix = `/storage/v1/object/public/${bucketName}/`;
    
    if (fileUrl.includes(publicPrefix)) {
      filePath = fileUrl.split(publicPrefix)[1];
    } else if (fileUrl.includes(`/${bucketName}/`)) {
      filePath = fileUrl.split(`/${bucketName}/`)[1];
    } else {
      return false;
    }

    if (!filePath) return false;

    // Strip query parameters if present and decode URI components
    filePath = filePath.split("?")[0];
    filePath = decodeURIComponent(filePath);

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.warn("Supabase Storage delete error:", error.message);
      return false;
    }

    console.log("Successfully deleted old photo from Supabase Storage:", filePath);
    return true;
  } catch (err) {
    console.warn("Failed to delete photo from Supabase Storage:", err);
    return false;
  }
}
