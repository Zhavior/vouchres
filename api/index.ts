import type { Request, Response } from "express";
import { createApp } from "../server";

let appPromise: ReturnType<typeof createApp> | null = null;

export default async function handler(req: Request, res: Response) {
  try {
    if (!appPromise) {
      console.log("[VERCEL_API] booting Express app");
      appPromise = createApp();
    }

    const app = await appPromise;
    return app(req, res);
  } catch (err: any) {
    console.error("[VERCEL_API] Express boot failed:", err?.stack || err?.message || err);
    return res.status(500).json({
      error: "vercel_api_boot_failed",
      message: err?.message || "Unknown Express boot error",
    });
  }
}
