import {
  getTierCustomizationPoints,
  getTierEntitlements,
  getStripePriceMatrix,
  isActiveTier,
} from "../server/services/billing/tierConfig";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) => [
    prefix ? `${prefix}.${key}` : key,
    ...flattenKeys(nested, prefix ? `${prefix}.${key}` : key),
  ]);
}

const free = getTierEntitlements("free");
const pro = getTierEntitlements("pro");
const creator = getTierEntitlements("creator");
const unknown = getTierEntitlements("unknown");
const elite = getTierEntitlements("elite");
const subscriptionResponse = {
  ...pro,
  status: "active",
  subscription: null,
  prices: getStripePriceMatrix(),
};

assert(getTierCustomizationPoints("free") === 0, "free should return 0 customization points");
assert(getTierCustomizationPoints("pro") === 250, "pro should return 250 customization points");
assert(getTierCustomizationPoints("creator") === 850, "creator should return 850 customization points");
assert(getTierCustomizationPoints("unknown") === 0, "unknown tier should return 0 customization points");
assert(!isActiveTier("elite"), "elite must not be an active tier");
assert(getTierCustomizationPoints("elite") === 0, "elite should not have active customization points");
assert(elite.tier === "free" && elite.monthlyCustomizationPoints === 0, "elite should normalize to free entitlements");
assert(free.monthlyCustomizationPoints === 0, "free entitlement response should include 0 points");
assert(pro.monthlyCustomizationPoints === 250, "pro entitlement response should include 250 points");
assert(creator.monthlyCustomizationPoints === 850, "creator entitlement response should include 850 points");
assert(unknown.monthlyCustomizationPoints === 0, "unknown entitlement response should include 0 points");
assert(
  Object.prototype.hasOwnProperty.call(subscriptionResponse, "monthlyCustomizationPoints"),
  "subscription response should include monthlyCustomizationPoints"
);

const backendNames = flattenKeys(subscriptionResponse).join(" ");
assert(
  !/(bet|betting|gambl|gambling|odds|boost|prize|cash|withdraw|transfer)/i.test(backendNames),
  "backend entitlement names should not use betting, gambling, cash, transfer, withdrawal, or prize wording"
);

console.log(
  JSON.stringify(
    {
      ok: true,
      tiers: {
        free: free.monthlyCustomizationPoints,
        pro: pro.monthlyCustomizationPoints,
        creator: creator.monthlyCustomizationPoints,
        unknown: unknown.monthlyCustomizationPoints,
        elite: elite.monthlyCustomizationPoints,
      },
      eliteActive: isActiveTier("elite"),
      subscriptionHasMonthlyCustomizationPoints:
        Object.prototype.hasOwnProperty.call(subscriptionResponse, "monthlyCustomizationPoints"),
      warnings: elite.warnings,
    },
    null,
    2
  )
);
