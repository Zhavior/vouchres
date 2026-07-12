import { supabase } from "./supabaseClient";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 3 * 1024 * 1024;
const FILE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function assertValidAvatar(file: File): string {
  const extension = FILE_EXTENSIONS[file.type];
  if (!extension) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size === 0 || file.size > MAX_AVATAR_BYTES) {
    throw new Error("Profile photos must be 3 MB or smaller.");
  }
  return extension;
}

/** Upload a cache-safe, account-owned image and return its public profile URL. */
export async function uploadProfileAvatar(file: File): Promise<string> {
  const extension = assertValidAvatar(file);
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    throw new Error("Sign in before changing your profile photo.");
  }

  const objectPath = `${auth.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Profile photo upload failed.");
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}
