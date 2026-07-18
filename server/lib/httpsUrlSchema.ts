import { z } from "zod";

/**
 * Public media URLs must be https so avatar/story fields cannot store
 * javascript:/data:/http: payloads that render as XSS or mixed content.
 */
export const HttpsUrlSchema = z
  .string()
  .url()
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, { message: "URL must use https" });
