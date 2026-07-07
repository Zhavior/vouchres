import { GoogleGenAI } from "@google/genai";
import type { AiThemeInput } from "../../validators/aiSchemas";

export interface GeneratedTheme {
  id: string;
  name: string;
  category: string;
  description: string;
  cost: number;
  badge: string;
  avatarAnimationClass: string;
  cardStyle: string;
  glowColor: string;
  particleDemo: string[];
  fontFamily: string;
  coverBg: string;
  customAIPhrase: string;
}

export interface AiThemeResponse {
  status: "success" | "simulated";
  theme: GeneratedTheme;
}

function cleanModelJson(value: string): string {
  let text = value.trim();
  if (text.startsWith("```json")) text = text.slice(7);
  if (text.endsWith("```")) text = text.slice(0, -3);
  return text.trim();
}

function themeId(): string {
  return `ai_theme_${Date.now()}`;
}

function safeString(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function safeParticles(value: unknown): string[] {
  if (!Array.isArray(value)) return ["AI", "VE", "WIN", "EDGE"];
  return value
    .map((item) => String(item ?? "").trim().slice(0, 12))
    .filter(Boolean)
    .slice(0, 5);
}

function finalizeTheme(raw: Partial<GeneratedTheme>, fallbackName: string): GeneratedTheme {
  return {
    id: themeId(),
    name: safeString(raw.name, fallbackName, 80),
    category: safeString(raw.category, "Specials", 40),
    description: safeString(raw.description, "Synthesized premium layout.", 150),
    cost: 150,
    badge: safeString(raw.badge, "AI THEME", 24),
    avatarAnimationClass: safeString(raw.avatarAnimationClass, "animate-pulse border-sky-400 scale-105 shadow-md shadow-sky-500/50", 240),
    cardStyle: safeString(raw.cardStyle, "bg-gradient-to-tr from-[#02101e]/40 via-slate-900/60 to-indigo-950/30 border-sky-500/40 shadow-xl", 300),
    glowColor: safeString(raw.glowColor, "from-sky-400 to-indigo-500", 80),
    particleDemo: safeParticles(raw.particleDemo),
    fontFamily: safeString(raw.fontFamily, "font-sans", 40),
    coverBg: safeString(raw.coverBg, "from-slate-900/50 to-sky-950/30", 160),
    customAIPhrase: safeString(raw.customAIPhrase, "SYSTEM ALIGNED WITH THE REQUESTED THEME", 100),
  };
}

function localTheme(prompt: string): GeneratedTheme {
  const words = prompt.toLowerCase();
  const title = prompt.charAt(0).toUpperCase() + prompt.slice(1);

  if (words.includes("cyber") || words.includes("neon") || words.includes("retro") || words.includes("matrix") || words.includes("laser")) {
    return finalizeTheme({
      name: "Synthwave Matrix Grid",
      category: "Vaporwave",
      description: "Retro grid aesthetics, violet scanlines, and digital outrun profile energy.",
      badge: "OUTRUN",
      avatarAnimationClass: "border-fuchsia-400 border-2 shadow-lg shadow-fuchsia-500/40 animate-pulse",
      cardStyle: "bg-gradient-to-tr from-fuchsia-950/40 via-slate-900/70 to-indigo-950/30 border-fuchsia-500/40 shadow-2xl",
      glowColor: "from-fuchsia-500 to-cyan-500",
      particleDemo: ["GRID", "NEON", "SUN", "VHS"],
      fontFamily: "font-display",
      coverBg: "from-fuchsia-500/20 to-indigo-500/20",
      customAIPhrase: "CHROME GLOWS UNDER VECTOR LIGHT",
    }, "Synthwave Matrix Grid");
  }

  if (words.includes("gold") || words.includes("rich") || words.includes("queen") || words.includes("king") || words.includes("trophy") || words.includes("royal")) {
    return finalizeTheme({
      name: "Aureum Royal Prestige",
      category: "Specials",
      description: "A prestigious gold layout with champion accents and high-contrast details.",
      badge: "PRESTIGE",
      avatarAnimationClass: "border-yellow-400 ring-2 ring-amber-300 animate-pulse scale-110 shadow-xl shadow-yellow-500/30",
      cardStyle: "bg-gradient-to-tr from-amber-950/40 via-slate-900/80 to-[#1e1505] border-yellow-500/50",
      glowColor: "from-yellow-400 to-amber-500",
      particleDemo: ["CROWN", "CUP", "GOLD", "GEM"],
      fontFamily: "font-serif",
      coverBg: "from-amber-500/20 to-yellow-500/20",
      customAIPhrase: "REGAL DETAIL FOR CHAMPION PRESENTATION",
    }, "Aureum Royal Prestige");
  }

  if (words.includes("anime") || words.includes("ninja") || words.includes("samurai") || words.includes("sparkle") || words.includes("sakura")) {
    return finalizeTheme({
      name: "Sakura Blade Aura",
      category: "Anime",
      description: "Anime-inspired blossom effects, sharp accent lines, and luminous motion.",
      badge: "SHINOBI",
      avatarAnimationClass: "border-pink-500 border-double border-4 scale-105 shadow-lg shadow-pink-500/40 animate-bounce",
      cardStyle: "bg-gradient-to-tr from-purple-950/40 via-[#101323] to-pink-950/30 border-pink-500/40",
      glowColor: "from-pink-400 to-rose-600",
      particleDemo: ["SAKURA", "BLADE", "AURA", "SPARK"],
      fontFamily: "font-sans",
      coverBg: "from-purple-500/20 to-pink-500/20",
      customAIPhrase: "BLOSSOM ENERGY WITH SHARP FOCUS",
    }, "Sakura Blade Aura");
  }

  return finalizeTheme({
    name: `Quantum ${title}`.slice(0, 80),
    category: "Specials",
    description: `A sleek AI customized theme built for "${prompt}" with high-contrast borders.`,
    badge: "AI MINT",
    avatarAnimationClass: "animate-pulse border-sky-400 scale-105 shadow-md shadow-sky-500/50",
    cardStyle: "bg-gradient-to-tr from-[#02101e]/40 via-slate-900/60 to-indigo-950/30 border-sky-500/40 shadow-xl shadow-sky-500/5",
    glowColor: "from-sky-400 to-indigo-500",
    particleDemo: ["AI", "EDGE", "GLASS", "SYNC"],
    fontFamily: "font-mono",
    coverBg: "from-slate-900/50 to-sky-950/30",
    customAIPhrase: `SYSTEM ALIGNED WITH ${prompt.toUpperCase()}`.slice(0, 100),
  }, `Quantum ${title}`);
}

export async function generateAiTheme(input: AiThemeInput): Promise<AiThemeResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  const fallback = localTheme(input.prompt);

  if (!apiKey) {
    return { status: "simulated", theme: fallback };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "vouchedge-backend",
        },
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Theme request: ${input.prompt}`,
      config: {
        responseMimeType: "application/json",
        systemInstruction: `Return only JSON for a dark glassmorphism profile theme. Fields: name, category, description, badge, avatarAnimationClass, cardStyle, glowColor, particleDemo, fontFamily, coverBg, customAIPhrase. Keep copy concise and avoid betting certainty language.`,
      },
    });

    const parsed = JSON.parse(cleanModelJson(response.text || "{}"));
    return {
      status: "success",
      theme: finalizeTheme(parsed, fallback.name),
    };
  } catch (error) {
    console.error("[ai:theme] Gemini theme generation failed", error);
    return { status: "simulated", theme: fallback };
  }
}
