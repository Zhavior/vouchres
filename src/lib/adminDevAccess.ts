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

export function canAccessHrNext(profile?: AccessProfile | null): boolean {
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

/**
 * Gate for admin-only surfaces — the Next pages (HR Next, Today Next, Live
 * Games Next), Aurora HQ, Admin Ops, and the signed-in home resolution in
 * `resolveSignedInHome`.
 *
 * Passes automatically on the dev server so local work never requires an
 * `is_staff` row. `import.meta.env.DEV` is false in any production build, so
 * deployments still require a real staff flag and the server's own
 * `requireStaff` middleware is untouched either way.
 */
export function canAccessAdminSurfaces(profile?: AccessProfile | null): boolean {
  if (isDevRuntime()) return true;
  return canAccessHrNext(profile);
}
