import { z } from "zod";
import { getSupabaseAdmin } from "../../middleware/auth";
import {
  DEFAULT_CAPPER_SETTINGS,
  normalizeCapperSettings,
  type CapperSettings,
} from "../../../src/lib/capperSettings";

export type BusinessProductPricingModel = "free" | "one_time" | "recurring" | "waitlist";
export type BusinessMembershipStatus = "active" | "trialing" | "past_due" | "canceled" | "pending" | "waitlist";

export interface CreatorBusinessProductProjection {
  id: string;
  code: string;
  name: string;
  description: string;
  pricingModel: BusinessProductPricingModel;
  priceCents: number;
  billingInterval: string | null;
  visibility: string;
  active: boolean;
  accessScope: Record<string, unknown>;
  sortOrder: number;
}

export interface CreatorBusinessProjection {
  id: string;
  ownerProfileId: string;
  slug: string;
  displayName: string;
  status: string;
  brandSettings: CapperSettings;
  products: CreatorBusinessProductProjection[];
  apps: Array<{
    id: string;
    appKey: string;
    enabled: boolean;
    config: Record<string, unknown>;
  }>;
}

export interface CreatorBusinessMembershipAccess {
  hasMembership: boolean;
  membershipStatus: BusinessMembershipStatus | null;
  productCode: string | null;
  accessScope: Record<string, boolean>;
}

export const CreatorBusinessUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  brandSettings: z.object({
    clubName: z.string().trim().max(60),
    clubTagline: z.string().trim().max(140),
    welcomeMessage: z.string().trim().max(240),
    offerHeadline: z.string().trim().max(80),
    offerSummary: z.string().trim().max(220),
    ctaLabel: z.string().trim().max(32),
    ctaSubtext: z.string().trim().max(120),
    badgeText: z.string().trim().max(24),
    heroStyle: z.enum(["midnight", "emerald", "crimson"]),
    featuredTags: z.array(z.string().trim().max(20)).max(6),
    subscriberChatEnabled: z.boolean(),
    announcementsEnabled: z.boolean(),
    showVerifiedRecord: z.boolean(),
    showTailRate: z.boolean(),
    profanityFilterEnabled: z.boolean(),
    linksAllowed: z.boolean(),
    slowModeSeconds: z.number().int().min(0).max(300),
    autoWelcomeEnabled: z.boolean(),
  }),
});

export const CreatorBusinessProductUpdateSchema = z.object({
  code: z.enum(["free-follow", "vip-club"]),
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(280),
  pricingModel: z.enum(["free", "one_time", "recurring", "waitlist"]),
  priceCents: z.number().int().min(0).max(1_000_000),
  billingInterval: z.string().trim().max(24).nullable().optional(),
  visibility: z.enum(["public", "hidden", "waitlist"]),
  active: z.boolean(),
  accessScope: z.object({
    shared_parlays: z.boolean().optional(),
    club_chat: z.boolean().optional(),
    announcements: z.boolean().optional(),
    dms: z.boolean().optional(),
    support_inbox: z.boolean().optional(),
    future_vip_tools: z.boolean().optional(),
  }),
});

function slugify(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "club";
}

async function reserveBusinessSlug(preferred: string, ownerProfileId: string): Promise<string> {
  const admin = await getSupabaseAdmin();
  const base = slugify(preferred);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${ownerProfileId.replace(/-/g, "").slice(0, 6 + attempt)}`;
    const { data, error } = await admin
      .from("creator_businesses")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
  }

  return `${base}-${ownerProfileId.replace(/-/g, "").slice(0, 10)}`;
}

async function writeBusinessEvent(input: {
  businessId: string;
  eventType: string;
  actorProfileId?: string | null;
  subjectProfileId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const admin = await getSupabaseAdmin();
  await admin.from("creator_business_events").insert({
    business_id: input.businessId,
    event_type: input.eventType,
    actor_profile_id: input.actorProfileId ?? null,
    subject_profile_id: input.subjectProfileId ?? null,
    payload: input.payload ?? {},
  });
}

async function createDefaultBusinessChildren(businessId: string) {
  const admin = await getSupabaseAdmin();

  await admin.from("creator_business_products").upsert(
    [
      {
        business_id: businessId,
        code: "free-follow",
        name: "Free Follow",
        description: "Unlock shared parlays, announcements, and club chat during beta.",
        pricing_model: "free",
        price_cents: 0,
        billing_interval: null,
        visibility: "public",
        active: true,
        access_scope: {
          shared_parlays: true,
          club_chat: true,
          announcements: true,
          dms: false,
          support_inbox: false,
        },
        sort_order: 0,
      },
      {
        business_id: businessId,
        code: "vip-club",
        name: "VIP Club",
        description: "Reserved for future premium memberships, deeper analytics, and advanced support.",
        pricing_model: "recurring",
        price_cents: 4999,
        billing_interval: "month",
        visibility: "hidden",
        active: false,
        access_scope: {
          shared_parlays: true,
          club_chat: true,
          announcements: true,
          dms: true,
          support_inbox: true,
          future_vip_tools: true,
        },
        sort_order: 10,
      },
    ],
    { onConflict: "business_id,code" },
  );

  await admin.from("creator_business_apps").upsert(
    [
      { business_id: businessId, app_key: "club_chat", enabled: true, config: { channel: "subscriber_hub" } },
      { business_id: businessId, app_key: "announcements", enabled: true, config: { channel: "subscriber_hub" } },
      { business_id: businessId, app_key: "shared_parlays", enabled: true, config: { source: "picks" } },
      { business_id: businessId, app_key: "support_inbox", enabled: false, config: {} },
      { business_id: businessId, app_key: "automations", enabled: true, config: { join_dm: true, churn_save: false } },
    ],
    { onConflict: "business_id,app_key" },
  );
}

function mapProduct(row: Record<string, unknown>): CreatorBusinessProductProjection {
  return {
    id: String(row.id),
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    pricingModel: String(row.pricing_model ?? "free") as BusinessProductPricingModel,
    priceCents: Number(row.price_cents ?? 0),
    billingInterval: row.billing_interval ? String(row.billing_interval) : null,
    visibility: String(row.visibility ?? "public"),
    active: row.active !== false,
    accessScope: (row.access_scope as Record<string, unknown> | null) ?? {},
    sortOrder: Number(row.sort_order ?? 0),
  };
}

async function loadBusinessProjectionByOwnerProfileId(ownerProfileId: string): Promise<CreatorBusinessProjection | null> {
  const admin = await getSupabaseAdmin();
  const { data: business, error } = await admin
    .from("creator_businesses")
    .select("id, owner_profile_id, slug, display_name, status, brand_settings")
    .eq("owner_profile_id", ownerProfileId)
    .maybeSingle();

  if (error) throw error;
  if (!business) return null;

  const [productsRes, appsRes] = await Promise.all([
    admin
      .from("creator_business_products")
      .select("id, code, name, description, pricing_model, price_cents, billing_interval, visibility, active, access_scope, sort_order")
      .eq("business_id", business.id)
      .order("sort_order", { ascending: true }),
    admin
      .from("creator_business_apps")
      .select("id, app_key, enabled, config")
      .eq("business_id", business.id)
      .order("app_key", { ascending: true }),
  ]);

  if (productsRes.error) throw productsRes.error;
  if (appsRes.error) throw appsRes.error;

  return {
    id: String(business.id),
    ownerProfileId: String(business.owner_profile_id),
    slug: String(business.slug),
    displayName: String(business.display_name ?? ""),
    status: String(business.status ?? "active"),
    brandSettings: normalizeCapperSettings(business.brand_settings),
    products: (productsRes.data ?? []).map((row) => mapProduct(row as Record<string, unknown>)),
    apps: (appsRes.data ?? []).map((row) => ({
      id: String(row.id),
      appKey: String(row.app_key ?? ""),
      enabled: row.enabled !== false,
      config: (row.config as Record<string, unknown> | null) ?? {},
    })),
  };
}

export async function ensureCreatorBusinessForProfile(ownerProfileId: string): Promise<CreatorBusinessProjection> {
  const existing = await loadBusinessProjectionByOwnerProfileId(ownerProfileId);
  if (existing) return existing;

  const admin = await getSupabaseAdmin();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, handle, username, display_name, capper_settings")
    .eq("id", ownerProfileId)
    .single();

  if (profileError || !profile) throw profileError ?? new Error("profile_not_found");

  const brandSettings = normalizeCapperSettings(profile.capper_settings);
  const displayName = String(profile.display_name ?? profile.handle ?? profile.username ?? "Creator Club").trim() || "Creator Club";
  const clubName = brandSettings.clubName || displayName;
  const slug = await reserveBusinessSlug(String(profile.handle ?? profile.username ?? clubName), ownerProfileId);

  const { data: created, error: createError } = await admin
    .from("creator_businesses")
    .insert({
      owner_profile_id: ownerProfileId,
      slug,
      display_name: clubName,
      brand_settings: {
        ...DEFAULT_CAPPER_SETTINGS,
        ...brandSettings,
        clubName,
      },
    })
    .select("id")
    .single();

  if (createError) {
    const retry = await loadBusinessProjectionByOwnerProfileId(ownerProfileId);
    if (retry) return retry;
    throw createError;
  }

  await createDefaultBusinessChildren(String(created.id));
  await writeBusinessEvent({
    businessId: String(created.id),
    eventType: "creator_business.created",
    actorProfileId: ownerProfileId,
    subjectProfileId: ownerProfileId,
    payload: { slug, clubName },
  }).catch(() => {});

  const projection = await loadBusinessProjectionByOwnerProfileId(ownerProfileId);
  if (!projection) throw new Error("creator_business_bootstrap_failed");
  return projection;
}

export async function getCreatorBusinessForProfile(ownerProfileId: string): Promise<CreatorBusinessProjection> {
  return ensureCreatorBusinessForProfile(ownerProfileId);
}

export async function updateCreatorBusinessForProfile(
  ownerProfileId: string,
  input: z.infer<typeof CreatorBusinessUpdateSchema>,
): Promise<CreatorBusinessProjection> {
  const current = await ensureCreatorBusinessForProfile(ownerProfileId);
  const admin = await getSupabaseAdmin();
  const brandSettings = normalizeCapperSettings({
    ...current.brandSettings,
    ...input.brandSettings,
    clubName: input.brandSettings.clubName || input.displayName,
  });

  const { error } = await admin
    .from("creator_businesses")
    .update({
      display_name: input.displayName.trim(),
      brand_settings: brandSettings,
    })
    .eq("id", current.id);

  if (error) throw error;

  await admin
    .from("profiles")
    .update({
      capper_settings: brandSettings,
    })
    .eq("id", ownerProfileId);

  await writeBusinessEvent({
    businessId: current.id,
    eventType: "creator_business.updated",
    actorProfileId: ownerProfileId,
    subjectProfileId: ownerProfileId,
    payload: {
      displayName: input.displayName.trim(),
      brandSettings,
    },
  }).catch(() => {});

  const next = await loadBusinessProjectionByOwnerProfileId(ownerProfileId);
  if (!next) throw new Error("creator_business_reload_failed");
  return next;
}

export async function updateCreatorBusinessProductForProfile(
  ownerProfileId: string,
  input: z.infer<typeof CreatorBusinessProductUpdateSchema>,
): Promise<CreatorBusinessProjection> {
  const current = await ensureCreatorBusinessForProfile(ownerProfileId);
  const admin = await getSupabaseAdmin();
  const { error } = await admin
    .from("creator_business_products")
    .update({
      name: input.name.trim(),
      description: input.description.trim(),
      pricing_model: input.pricingModel,
      price_cents: input.pricingModel === "free" ? 0 : input.priceCents,
      billing_interval: input.pricingModel === "recurring" ? (input.billingInterval?.trim() || "month") : null,
      visibility: input.visibility,
      active: input.active,
      access_scope: input.accessScope,
    })
    .eq("business_id", current.id)
    .eq("code", input.code);

  if (error) throw error;

  await writeBusinessEvent({
    businessId: current.id,
    eventType: "creator_business.product_updated",
    actorProfileId: ownerProfileId,
    subjectProfileId: ownerProfileId,
    payload: {
      code: input.code,
      pricingModel: input.pricingModel,
      visibility: input.visibility,
      active: input.active,
    },
  }).catch(() => {});

  const next = await loadBusinessProjectionByOwnerProfileId(ownerProfileId);
  if (!next) throw new Error("creator_business_reload_failed");
  return next;
}

export async function syncLegacyCapperSettingsToCreatorBusiness(
  ownerProfileId: string,
  legacyCapperSettings: unknown,
): Promise<void> {
  const current = await ensureCreatorBusinessForProfile(ownerProfileId);
  const admin = await getSupabaseAdmin();
  const brandSettings = normalizeCapperSettings(legacyCapperSettings);
  const { error } = await admin
    .from("creator_businesses")
    .update({
      display_name: brandSettings.clubName || current.displayName,
      brand_settings: brandSettings,
    })
    .eq("id", current.id);
  if (error) throw error;
}

export async function loadCreatorBusinessBrandSettingsByProfileIds(profileIds: string[]): Promise<Map<string, CapperSettings>> {
  const ids = [...new Set(profileIds.filter(Boolean))];
  const map = new Map<string, CapperSettings>();
  if (ids.length === 0) return map;

  const admin = await getSupabaseAdmin();
  const { data, error } = await admin
    .from("creator_businesses")
    .select("owner_profile_id, brand_settings")
    .in("owner_profile_id", ids);

  if (error) throw error;

  for (const row of data ?? []) {
    map.set(String(row.owner_profile_id), normalizeCapperSettings(row.brand_settings));
  }
  return map;
}

async function getFreeFollowProductIdForBusiness(businessId: string): Promise<string | null> {
  const admin = await getSupabaseAdmin();
  const { data, error } = await admin
    .from("creator_business_products")
    .select("id")
    .eq("business_id", businessId)
    .eq("code", "free-follow")
    .maybeSingle();
  if (error) throw error;
  return data?.id ? String(data.id) : null;
}

export async function ensureActiveMembershipForFollower(input: {
  ownerProfileId: string;
  followerProfileId: string;
  source?: string;
}): Promise<void> {
  const business = await ensureCreatorBusinessForProfile(input.ownerProfileId);
  const admin = await getSupabaseAdmin();
  const productId = await getFreeFollowProductIdForBusiness(business.id);
  const { data: existing, error: lookupError } = await admin
    .from("creator_business_memberships")
    .select("id, status")
    .eq("business_id", business.id)
    .eq("profile_id", input.followerProfileId)
    .maybeSingle();

  if (lookupError) throw lookupError;

  const payload = {
    business_id: business.id,
    profile_id: input.followerProfileId,
    product_id: productId,
    status: "active" as BusinessMembershipStatus,
    source: input.source ?? "follow_subscribe",
    cancel_at_period_end: false,
    metadata: {
      grant_reason: "follow_subscribe",
      owner_profile_id: input.ownerProfileId,
    },
  };

  if (existing?.id) {
    const { error } = await admin
      .from("creator_business_memberships")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await admin
      .from("creator_business_memberships")
      .insert(payload);
    if (error) throw error;
  }

  await writeBusinessEvent({
    businessId: business.id,
    eventType: "membership.activated",
    actorProfileId: input.followerProfileId,
    subjectProfileId: input.followerProfileId,
    payload: {
      owner_profile_id: input.ownerProfileId,
      source: input.source ?? "follow_subscribe",
    },
  }).catch(() => {});
}

export async function cancelMembershipForFollower(input: {
  ownerProfileId: string;
  followerProfileId: string;
  source?: string;
}): Promise<void> {
  const business = await ensureCreatorBusinessForProfile(input.ownerProfileId);
  const admin = await getSupabaseAdmin();
  const { data: existing, error: lookupError } = await admin
    .from("creator_business_memberships")
    .select("id, status")
    .eq("business_id", business.id)
    .eq("profile_id", input.followerProfileId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (!existing?.id) return;

  const { error } = await admin
    .from("creator_business_memberships")
    .update({
      status: "canceled" as BusinessMembershipStatus,
      cancel_at_period_end: false,
      current_period_end: new Date().toISOString(),
      metadata: {
        revoke_reason: "unfollow",
        owner_profile_id: input.ownerProfileId,
        source: input.source ?? "follow_unsubscribe",
      },
    })
    .eq("id", existing.id);

  if (error) throw error;

  await writeBusinessEvent({
    businessId: business.id,
    eventType: "membership.canceled",
    actorProfileId: input.followerProfileId,
    subjectProfileId: input.followerProfileId,
    payload: {
      owner_profile_id: input.ownerProfileId,
      source: input.source ?? "follow_unsubscribe",
    },
  }).catch(() => {});
}

export async function hasActiveMembershipForFollower(input: {
  ownerProfileId: string;
  followerProfileId: string;
}): Promise<boolean> {
  const business = await ensureCreatorBusinessForProfile(input.ownerProfileId);
  const admin = await getSupabaseAdmin();
  const { data, error } = await admin
    .from("creator_business_memberships")
    .select("id, status")
    .eq("business_id", business.id)
    .eq("profile_id", input.followerProfileId)
    .in("status", ["active", "trialing"])
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

export async function getMembershipAccessForFollower(input: {
  ownerProfileId: string;
  followerProfileId: string;
}): Promise<CreatorBusinessMembershipAccess> {
  const business = await ensureCreatorBusinessForProfile(input.ownerProfileId);
  const admin = await getSupabaseAdmin();
  const { data: membership, error: membershipError } = await admin
    .from("creator_business_memberships")
    .select("id, status, product_id")
    .eq("business_id", business.id)
    .eq("profile_id", input.followerProfileId)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership?.id) {
    return {
      hasMembership: false,
      membershipStatus: null,
      productCode: null,
      accessScope: {},
    };
  }

  if (!membership.product_id) {
    return {
      hasMembership: true,
      membershipStatus: String(membership.status) as BusinessMembershipStatus,
      productCode: null,
      accessScope: {},
    };
  }

  const { data: product, error: productError } = await admin
    .from("creator_business_products")
    .select("code, access_scope")
    .eq("id", membership.product_id)
    .maybeSingle();

  if (productError) throw productError;

  return {
    hasMembership: true,
    membershipStatus: String(membership.status) as BusinessMembershipStatus,
    productCode: product?.code ? String(product.code) : null,
    accessScope: (product?.access_scope as Record<string, boolean> | null) ?? {},
  };
}

export async function canFollowerAccessBusinessCapability(input: {
  ownerProfileId: string;
  followerProfileId: string;
  capability: "shared_parlays" | "announcements" | "club_chat" | "dms" | "support_inbox";
}): Promise<boolean> {
  if (input.ownerProfileId === input.followerProfileId) return true;
  const access = await getMembershipAccessForFollower({
    ownerProfileId: input.ownerProfileId,
    followerProfileId: input.followerProfileId,
  });
  if (!access.hasMembership) return false;
  return access.accessScope[input.capability] !== false;
}
