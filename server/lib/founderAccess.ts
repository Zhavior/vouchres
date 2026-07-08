const FOUNDER_EMAILS = new Set(["zhavior@gmail.com"]);

export function isFounderEmail(email?: string | null) {
  return !!email && FOUNDER_EMAILS.has(email.trim().toLowerCase());
}

export function shouldBypassPointCost(email?: string | null) {
  return isFounderEmail(email);
}

export function getFounderPointsLabel(email?: string | null) {
  return isFounderEmail(email) ? "∞" : null;
}
