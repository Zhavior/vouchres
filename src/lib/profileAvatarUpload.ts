import { getAuthToken } from "./supabaseClient";

const MAX_AVATAR_BYTES = 3 * 1024 * 1024;
const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

function resolveMimeType(file: File): string {
  if (SUPPORTED_TYPES.has(file.type)) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  const inferred = extension ? MIME_BY_EXTENSION[extension] : undefined;
  if (!inferred) {
    throw new Error("Choose a JPG, PNG, WebP, or HEIC image.");
  }
  return inferred;
}

function assertValidAvatar(file: File): string {
  const mimeType = resolveMimeType(file);
  if (file.size === 0 || file.size > MAX_AVATAR_BYTES) {
    throw new Error("Profile photos must be 3 MB or smaller.");
  }
  return mimeType;
}

/** Upload through the authenticated server, which safely normalizes phone photos to WebP. */
export async function uploadProfileAvatar(file: File): Promise<string> {
  const mimeType = assertValidAvatar(file);
  const token = await getAuthToken();
  if (!token) {
    throw new Error("Sign in before changing your profile photo.");
  }

  const response = await fetch(
    new URL(
      "/api/auth/profile/avatar",
      import.meta.env.VITE_API_BASE_URL || window.location.origin,
    ),
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": mimeType },
      body: file,
      credentials: "include",
    },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        "Profile photo upload failed.",
    );
  }
  if (typeof payload?.avatar_url !== "string") {
    throw new Error("Profile photo upload returned an invalid response.");
  }
  return payload.avatar_url;
}
