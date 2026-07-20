import { buildV3ParlayDetailPayload, buildV3ParlayListPayload } from "../server/v3/modules/parlays/handlers";
import { getUserParlay, listUserParlays } from "../server/services/parlays/userParlayService";
import { getSupabaseAdmin } from "../server/middleware/auth";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "meta" && key !== "version")
      .map(([key, nested]) => [key, stable(nested)] as const)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

function equal(a: unknown, b: unknown): boolean {
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}

async function discoverSample() {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("picks")
    .select("id,user_id,created_at")
    .eq("leg_type", "parlay")
    .not("user_id", "is", null)
    .is("user_hidden_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id || !data?.user_id) {
    throw new Error("No visible user-owned parlay found to compare.");
  }

  return {
    parlayId: String(data.id),
    userId: String(data.user_id),
  };
}

async function main() {
  if ((!process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(JSON.stringify({
      ok: true,
      mode: "legacy_vs_v3_parlay_read_compare",
      runtimeCompared: false,
      warnings: [
        "Backend Supabase env vars are missing; live compare skipped.",
      ],
    }, null, 2));
    return;
  }

  const sample = await discoverSample();

  const legacyDetail = { parlay: await getUserParlay(sample) };
  const v3Detail = await buildV3ParlayDetailPayload(sample);

  const legacyList = await listUserParlays({
    userId: sample.userId,
    limit: 10,
    offset: 0,
  });
  const v3List = await buildV3ParlayListPayload({
    userId: sample.userId,
    limit: 10,
    offset: 0,
  });

  const checks = [
    {
      name: "parlay detail",
      ok: equal(legacyDetail, v3Detail),
      detail: equal(legacyDetail, v3Detail) ? "matched" : "detail mismatch",
    },
    {
      name: "parlay list",
      ok: equal(legacyList, v3List),
      detail: equal(legacyList, v3List) ? "matched" : "list mismatch",
    },
  ];

  for (const check of checks) {
    console.log(`${check.ok ? "PASS" : "FAIL"} · ${check.name} · ${check.detail}`);
  }

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    throw new Error(`Legacy vs V3 parlay read compare failed (${failed.length}/${checks.length})`);
  }

  console.log(JSON.stringify({
    ok: true,
    mode: "legacy_vs_v3_parlay_read_compare",
    runtimeCompared: true,
    checkedAt: new Date().toISOString(),
    sample,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
