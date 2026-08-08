/**
 * Gemini client wrapper — BACKEND ONLY.
 * Reads GEMINI_API_KEY from env, never exposes it. Adds timeout, caching, and a
 * graceful fallback so the frontend never crashes when AI is unavailable.
 */
import { GoogleGenAI } from "@google/genai";
import { createHash } from "node:crypto";
import { TTLCache, TTL } from "../../lib/cache";
import appConfig from "../../platform/config/appConfig";
import { z } from "zod";

const aiCache = new TTLCache<string>(TTL.aiExplanation);
const MODEL = appConfig.gemini.model;
const TIMEOUT_MS = 12000;
const structuredCache = new TTLCache<unknown>(TTL.aiExplanation);
let budgetDay = "";
let budgetUsed = 0;
const DAILY_STRUCTURED_LIMIT = appConfig.gemini.dailyStructuredLimit;

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY !== undefined ? process.env.GEMINI_API_KEY : appConfig.gemini.apiKey;
}

export function hasGeminiKey(): boolean {
  const key = getGeminiApiKey();
  return !!key && key.trim().length > 0;
}

/**
 * Bind a cache entry to the EXACT content that produced it.
 *
 * These caches are process-global and shared across all users, so a cache key
 * that omits any attacker-controlled part of the prompt is a cross-user
 * poisoning primitive: send one request with injected text in a field that is
 * in the prompt but not in the key, and every other user asking about the same
 * subject is served your steered answer until the TTL expires. In a betting
 * product, injecting "guaranteed lock" into content the platform presents as
 * its own analysis is a compliance hazard, not just a correctness bug.
 *
 * Callers keep passing a readable namespace (e.g. "player-research:Aaron Judge")
 * for debuggability; the digest of the full request is appended so two
 * different prompts can never collide on one entry.
 *
 * Trade-off: hit rate drops, because inputs that genuinely differ (updated
 * stats, a different system instruction) now miss instead of silently serving
 * a stale answer built from other inputs. That is the correct behaviour — the
 * old hits were returning answers computed from different data.
 */
function contentBoundCacheKey(namespace: string, parts: Array<string | undefined>): string {
  const digest = createHash("sha256")
    .update(parts.map((part) => part ?? "").join("\u0000"))
    .digest("hex")
    .slice(0, 32);
  return `${namespace}#${digest}`;
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
  const cacheKey = contentBoundCacheKey(opts.cacheKey, [opts.prompt, opts.systemInstruction, MODEL]);
  const cached = aiCache.get(cacheKey);
  if (cached) return { text: cached, status: "cached" };

  if (!hasGeminiKey()) return { text: opts.fallback, status: "no-key" };

  try {
    const ai = new GoogleGenAI({
      apiKey: (getGeminiApiKey() || ""),
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
    aiCache.set(cacheKey, text, opts.ttlMs);
    return { text, status: "live" };
  } catch (err) {
    console.error("[geminiClient] generateText failed:", (err as Error).message);
    return { text: opts.fallback, status: "fallback" };
  }
}

export async function generateStructured<TSchema extends z.ZodTypeAny>(opts: {
  cacheKey: string;
  prompt: string;
  schema: TSchema;
  fallback: z.infer<TSchema>;
  systemInstruction?: string;
  model?: string;
}): Promise<{ data: z.infer<TSchema>; status: "live" | "cached" | "fallback" | "no-key"; model: string }> {
  const cacheKey = contentBoundCacheKey(opts.cacheKey, [
    opts.prompt,
    opts.systemInstruction,
    opts.model ?? appConfig.gemini.brainModel,
  ]);
  const cached = structuredCache.get(cacheKey);
  if (cached) return { data: opts.schema.parse(cached), status: "cached", model: opts.model ?? MODEL };
  if (!hasGeminiKey()) return { data: opts.fallback, status: "no-key", model: opts.model ?? MODEL };

  const today = new Date().toISOString().slice(0, 10);
  if (budgetDay !== today) { budgetDay = today; budgetUsed = 0; }
  if (budgetUsed >= DAILY_STRUCTURED_LIMIT) return { data: opts.fallback, status: "fallback", model: opts.model ?? MODEL };
  budgetUsed += 1;

  const model = opts.model ?? appConfig.gemini.brainModel;
  try {
    const ai = new GoogleGenAI({ apiKey: (getGeminiApiKey() || ""), httpOptions: { headers: { "User-Agent": "vouchedge-brain" } } });
    const response = await withTimeout(ai.models.generateContent({
      model,
      contents: opts.prompt,
      config: {
        systemInstruction: opts.systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(opts.schema),
        temperature: 0.1,
        maxOutputTokens: 1200,
      },
    }), TIMEOUT_MS);
    const parsed = opts.schema.parse(JSON.parse(response.text || "{}"));
    structuredCache.set(cacheKey, parsed);
    return { data: parsed, status: "live", model };
  } catch (error) {
    console.error("[geminiClient] generateStructured failed:", (error as Error).message);
    return { data: opts.fallback, status: "fallback", model };
  }
}

export interface GeminiImageResult {
  imageBase64: string;
  status: "live" | "no-key";
}

export async function generateImage(opts: {
  prompt: string;
  aspectRatio?: string;
  model?: string;
}): Promise<GeminiImageResult> {
  if (!hasGeminiKey()) {
    return {
      imageBase64: "",
      status: "no-key",
    };
  }

  const ai = new GoogleGenAI({
    apiKey: (getGeminiApiKey() || ""),
    httpOptions: {
      headers: {
        "User-Agent": "vouchedge-backend",
      },
    },
  });

  const response = await withTimeout(
    ai.models.generateContent({
      model: opts.model ?? "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: opts.prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: opts.aspectRatio,
        },
      },
    }),
    TIMEOUT_MS,
  );

  const imagePart = response.candidates?.[0]?.content?.parts?.find(
    (part) => part.inlineData?.data,
  );

  return {
    imageBase64: imagePart?.inlineData?.data ?? "",
    status: "live",
  };
}

