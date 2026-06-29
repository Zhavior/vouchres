/**
 * Gemini client wrapper — BACKEND ONLY.
 * Reads GEMINI_API_KEY from env, never exposes it. Adds timeout, caching, and a
 * graceful fallback so the frontend never crashes when AI is unavailable.
 */
import { GoogleGenAI } from "@google/genai";
import { TTLCache, TTL } from "../../lib/cache";

const aiCache = new TTLCache<string>(TTL.aiExplanation);
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const TIMEOUT_MS = 12000;

export function hasGeminiKey(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Gemini timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

export interface GeminiResult {
  text: string;
  status: "live" | "cached" | "fallback" | "no-key";
}

/**
 * Generate text from a prompt, cached by a stable key. If no key / error / timeout,
 * returns the provided fallback text with an honest status flag.
 */
export async function generateText(opts: {
  cacheKey: string;
  prompt: string;
  systemInstruction?: string;
  fallback: string;
  ttlMs?: number;
}): Promise<GeminiResult> {
  const cached = aiCache.get(opts.cacheKey);
  if (cached) return { text: cached, status: "cached" };

  if (!hasGeminiKey()) return { text: opts.fallback, status: "no-key" };

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY as string,
      httpOptions: { headers: { "User-Agent": "vouchedge-backend" } },
    });
    const response = await withTimeout(
      ai.models.generateContent({
        model: MODEL,
        contents: opts.prompt,
        config: opts.systemInstruction ? { systemInstruction: opts.systemInstruction } : {},
      }),
      TIMEOUT_MS
    );
    const text = (response.text || "").trim() || opts.fallback;
    aiCache.set(opts.cacheKey, text, opts.ttlMs);
    return { text, status: "live" };
  } catch (err) {
    console.error("[geminiClient] generateText failed:", (err as Error).message);
    return { text: opts.fallback, status: "fallback" };
  }
}
