import { getAuthToken } from "./supabaseClient";

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

export async function uploadPostAudio(blob: Blob): Promise<{ mediaPath: string; mediaUrl: string }> {
  if (blob.size === 0 || blob.size > MAX_AUDIO_BYTES) {
    throw new Error("Voice posts must be 8 MB or smaller.");
  }
  const token = await getAuthToken();
  if (!token) throw new Error("Sign in before posting audio.");

  const response = await fetch(
    new URL("/api/posts/audio", import.meta.env.VITE_API_BASE_URL || window.location.origin),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": blob.type || "audio/webm",
      },
      body: blob,
      credentials: "include",
    },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok || typeof payload?.media_path !== "string" || typeof payload?.media_url !== "string") {
    throw new Error(payload?.error?.message || payload?.message || "Voice upload failed.");
  }
  return { mediaPath: payload.media_path, mediaUrl: payload.media_url };
}
