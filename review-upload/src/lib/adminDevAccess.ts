import { CreatorProofProfile } from "../types";

type AccessProfile = Partial<CreatorProofProfile> & {
  role?: string;
  userRole?: string;
  isAdmin?: boolean;
  isStaff?: boolean;
  isDeveloper?: boolean;
  staff?: boolean;
  admin?: boolean;
};

export function isDevRuntime(): boolean {
  return Boolean(import.meta.env.DEV);
}

export function canAccessThemeStore(profile?: AccessProfile | null): boolean {
  if (isDevRuntime()) return true;
  if (import.meta.env.VITE_THEME_STORE_VISIBLE === "true") return true;

  const normalizedRole = String(profile?.role || profile?.userRole || "").toLowerCase();
  return Boolean(
    profile?.isAdmin ||
      profile?.admin ||
      profile?.isStaff ||
      profile?.staff ||
      profile?.isDeveloper ||
      normalizedRole === "admin" ||
      normalizedRole === "staff" ||
      normalizedRole === "developer" ||
      normalizedRole === "dev",
  );
}
