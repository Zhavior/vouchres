import { trackEvent } from "./analytics";

export function trackProductEvent(
  name: string,
  properties?: Record<string, unknown>
) {
  trackEvent(name, {
    timestamp: new Date().toISOString(),
    ...properties,
  });
}

export const ProductEvents = {
  proGateViewed: (feature: string) =>
    trackProductEvent("pro_gate_viewed", { feature }),

  proUpgradeClicked: (feature: string) =>
    trackProductEvent("pro_upgrade_clicked", { feature }),

  checkoutStarted: (tier: string) =>
    trackProductEvent("checkout_started", { tier }),

  proSubscribed: (tier: string) =>
    trackProductEvent("pro_subscribed", { tier }),
};
