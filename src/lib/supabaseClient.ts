import { createClient } from "@supabase/supabase-js";

function isValidUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const viteUrl = import.meta.env.VITE_SUPABASE_URL;
const nextUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL;

const viteAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const nextAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseUrl = isValidUrl(viteUrl) ? viteUrl : nextUrl;
const supabaseAnonKey = viteAnonKey || nextAnonKey || "";

if (!isValidUrl(supabaseUrl)) {
  console.error("Invalid Supabase URL. Check VITE_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in Vercel.");
}

if (!supabaseAnonKey) {
  console.error("Missing Supabase anon key. Check VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
}

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey);
