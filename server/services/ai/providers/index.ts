import type { AIProvider } from "../provider";

const providers = new Map<string, AIProvider>();

export function registerProvider(provider: AIProvider): void {
  providers.set(provider.name, provider);
}

export function getProvider(name: string): AIProvider {
  const provider = providers.get(name);

  if (!provider) {
    throw new Error(`AI provider "${name}" is not registered.`);
  }

  return provider;
}

export function hasProvider(name: string): boolean {
  return providers.has(name);
}

export function listProviders(): AIProvider[] {
  return [...providers.values()];
}
