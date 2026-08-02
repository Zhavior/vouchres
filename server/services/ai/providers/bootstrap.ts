import { registerProvider } from "./index";
import { geminiProvider } from "./geminiProvider";
import { openRouterProvider } from "./openRouterProvider";

let initialized = false;

/**
 * Registers all available AI providers.
 * Safe to call multiple times.
 */
export function bootstrapProviders(): void {
  if (initialized) {
    return;
  }

  registerProvider(geminiProvider);
  registerProvider(openRouterProvider);

  initialized = true;
}
