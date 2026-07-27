export const FOUNDER_EMAIL = "zhavior@gmail.com";
export const FOUNDER_POINTS = 999999999;

export function isFounderEmail(email?: string | null) {
  return !!email && email.trim().toLowerCase() === FOUNDER_EMAIL;
}

export function forceFounderPoints() {
  const possibleKeys = [
    "points",
    "credits",
    "coins",
    "balance",
    "wallet",
    "walletBalance",
    "pointsBalance",
    "vouch_points",
    "vouchPoints",
    "vouchedge_points",
    "vouchedge_credits",
    "theme_points",
    "themeStorePoints",
    "user_points",
  ];

  for (const key of possibleKeys) {
    localStorage.setItem(key, String(FOUNDER_POINTS));
  }

  localStorage.setItem("vouchedge_founder_email", FOUNDER_EMAIL);
  localStorage.setItem("vouchedge_founder_mode", "true");
  localStorage.setItem("vouchedge_unlimited_points", "true");
}

export function getFounderPointsLabel(email?: string | null) {
  return isFounderEmail(email) ? "∞" : null;
}
