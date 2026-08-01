import { AppError } from "../../errors/AppError";
import {
  generateImage,
} from "./geminiClient";
import type { AiImageInput } from "../../validators/aiSchemas";

export type AiImageResponse =
  | { status: "success"; imageUrl: string }
  | { status: "no-key"; error: string };

export async function generateAiImage(
  input: AiImageInput,
): Promise<AiImageResponse> {
  const result = await generateImage({
    prompt: input.prompt,
    aspectRatio: input.aspectRatio,
  });

  if (result.status === "no-key") {
    return {
      status: "no-key",
      error: "GEMINI_API_KEY is not defined in the server environment.",
    };
  }

  if (!result.imageBase64) {
    throw new AppError({
      status: 502,
      code: "external_service_error",
      message: "Gemini did not return an image payload.",
    });
  }

  return {
    status: "success",
    imageUrl: `data:image/png;base64,${result.imageBase64}`,
  };
}
