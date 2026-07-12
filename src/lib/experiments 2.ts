export type ExperimentName =
  | "new_onboarding_v2"
  | "personalized_edge_intro";

const STORAGE_PREFIX = "vouchedge_experiment_";

function hashUser(userId: string) {
  let hash = 0;

  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function getExperimentVariant(
  experiment: ExperimentName,
  userId: string
): "control" | "variant" {
  const key = `${STORAGE_PREFIX}${experiment}_${userId}`;

  const existing = localStorage.getItem(key);

  if (existing === "control" || existing === "variant") {
    return existing;
  }

  const variant =
    hashUser(userId) % 2 === 0
      ? "control"
      : "variant";

  localStorage.setItem(key, variant);

  return variant;
}
