/**
 * Product conversion events.
 *
 * Analytics is lazy-loaded so PostHog does not inflate feature bundles.
 */

async function send(
  name: string,
  properties?: Record<string, unknown>
) {
  const { trackEvent } = await import("./analytics");

  trackEvent(name, {
    timestamp: new Date().toISOString(),
    ...properties,
  });
}

export const ProductEvents = {
  proGateViewed(feature: string) {
    void send("pro_gate_viewed", { feature });
  },

  proUpgradeClicked(feature: string) {
    void send("pro_upgrade_clicked", { feature });
  },

  checkoutStarted(tier: string) {
    void send("checkout_started", { tier });
  },

  proSubscribed(tier: string) {
    void send("pro_subscribed", { tier });
  },

  firstEdgeViewed() {
    void send("first_edge_viewed", {
      first_value_feature: "featured_edge",
    });
  },

  firstVouchQuestion() {
    void send("first_vouch_question", {
      first_value_feature: "vouch_ai",
    });
  },

  firstPlayerTracked() {
    void send("first_player_tracked", {
      first_value_feature: "player_tracking",
    });
  },

  dailyBriefOpened() {
    void send("daily_brief_opened");
  },

  notificationOpened(kind?: string) {
    void send("notification_opened", { kind });
  },

  returningSession() {
    void send("returning_session");
  },

};
