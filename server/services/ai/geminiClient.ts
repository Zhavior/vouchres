/**
 * Gemini client wrapper — BACKEND ONLY.
 * Reads GEMINI_API_KEY from env, never exposes it. Adds timeout, caching, and a
 * graceful fallback so the frontend never crashes when AI is unavailable.
 */
import { GoogleGenAI } from "@google/genai";
import { TTLCache, TTL } from "../../lib/cache";
import { z } from "zod";

const aiCache = new TTLCache<string>(TTL.aiExplanation);
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";
const TIMEOUT_MS = 12000;
const structuredCache = new TTLCache<unknown>(TTL.aiExplanation);
let budgetDay = "";
let budgetUsed = 0;
const DAILY_STRUCTURED_LIMIT = Number(process.env.GEMINI_BRAIN_DAILY_LIMIT ?? 12);

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

export async function generateStructured<TSchema extends z.ZodTypeAny>(opts: {
  cacheKey: string;
  prompt: string;
  schema: TSchema;
  fallback: z.infer<TSchema>;
  systemInstruction?: string;
  model?: string;
}): Promise<{ data: z.infer<TSchema>; status: "live" | "cached" | "fallback" | "no-key"; model: string }> {
  const cached = structuredCache.get(opts.cacheKey);
  if (cached) return { data: opts.schema.parse(cached), status: "cached", model: opts.model ?? MODEL };
  if (!hasGeminiKey()) return { data: opts.fallback, status: "no-key", model: opts.model ?? MODEL };

  const today = new Date().toISOString().slice(0, 10);
  if (budgetDay !== today) { budgetDay = today; budgetUsed = 0; }
  if (budgetUsed >= DAILY_STRUCTURED_LIMIT) return { data: opts.fallback, status: "fallback", model: opts.model ?? MODEL };
  budgetUsed += 1;

  const model = opts.model ?? process.env.GEMINI_BRAIN_MODEL ?? "gemini-3.1-flash-lite";
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string, httpOptions: { headers: { "User-Agent": "vouchedge-brain" } } });
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
    structuredCache.set(opts.cacheKey, parsed);
    return { data: parsed, status: "live", model };
  } catch (error) {
    console.error("[geminiClient] generateStructured failed:", (error as Error).message);
    return { data: opts.fallback, status: "fallback", model };
  }
}
