import { supabase } from "./supabaseClient";

const AVATAR_BUCKET = "avatars";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const FILE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function assertValidProfileImage(file: File, label: string): string {
  const extension = FILE_EXTENSIONS[file.type];
  if (!extension) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error(`${label} must be 3 MB or smaller.`);
  }
  return extension;
}

async function uploadOwnedProfileImage(
  file: File,
  opts: { objectKey: (userId: string, extension: string) => string; label: string; signInMessage: string },
): Promise<string> {
  const extension = assertValidProfileImage(file, opts.label);
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    throw new Error(opts.signInMessage);
  }

  const objectPath = opts.objectKey(auth.user.id, extension);
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || `${opts.label} upload failed.`);
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

/** Upload a cache-safe, account-owned image and return its public profile URL. */
export async function uploadProfileAvatar(file: File): Promise<string> {
  return uploadOwnedProfileImage(file, {
    label: "Profile photos",
    signInMessage: "Sign in before changing your profile photo.",
    objectKey: (userId, extension) => `${userId}/${crypto.randomUUID()}.${extension}`,
  });
}

/** Upload a cache-safe cover/header image for the profile banner. */
export async function uploadProfileHeader(file: File): Promise<string> {
  return uploadOwnedProfileImage(file, {
    label: "Header images",
    signInMessage: "Sign in before changing your profile header.",
    objectKey: (userId, extension) => `${userId}/header/${crypto.randomUUID()}.${extension}`,
  });
}
