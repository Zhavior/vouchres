import { GoogleGenAI } from "@google/genai";
import { AppError } from "../../errors/AppError";
import type { AiImageInput } from "../../validators/aiSchemas";

export type AiImageResponse =
  | { status: "success"; imageUrl: string }
  | { status: "no-key"; error: string };

export async function generateAiImage(input: AiImageInput): Promise<AiImageResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      status: "no-key",
      error: "GEMINI_API_KEY is not defined in the server environment.",
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "vouchedge-backend",
      },
    },
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [{ text: input.prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: input.aspectRatio,
      },
    },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData?.data);
  const base64Image = imagePart?.inlineData?.data;

  if (!base64Image) {
    throw new AppError({
      status: 502,
      code: "external_service_error",
      message: "Gemini did not return an image payload.",
    });
  }

  return {
    status: "success",
    imageUrl: `data:image/png;base64,${base64Image}`,
  };
}
