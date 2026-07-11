import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(path.join(process.cwd(), "package.json"));

export interface OpenTimestampStampResult {
  proofBase64: string;
  stampedAt: string;
  calendars: string[];
}

function loadOpenTimestamps(): any {
  return require("opentimestamps");
}

export async function stampSha256ProofHash(proofHashHex: string): Promise<OpenTimestampStampResult | null> {
  const normalized = String(proofHashHex ?? "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    return null;
  }

  try {
    const OpenTimestamps = loadOpenTimestamps();
    const hash = Buffer.from(normalized, "hex");
    const detached = OpenTimestamps.DetachedTimestampFile.fromHash(new OpenTimestamps.Ops.OpSHA256(), hash);
    await OpenTimestamps.stamp(detached);
    const bytes: Uint8Array = detached.serializeToBytes();
    return {
      proofBase64: Buffer.from(bytes).toString("base64"),
      stampedAt: new Date().toISOString(),
      calendars: [
        "https://a.pool.opentimestamps.org",
        "https://b.pool.opentimestamps.org",
        "https://a.pool.eternitywall.com",
        "https://ots.btc.catallaxy.com",
      ],
    };
  } catch (error) {
    console.warn("[openTimestampService] stamp failed", (error as Error)?.message ?? error);
    return null;
  }
}

export function decodeOtsProofBase64(proofBase64: string): Buffer | null {
  const raw = String(proofBase64 ?? "").trim();
  if (!raw) return null;
  try {
    const buf = Buffer.from(raw, "base64");
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  }
}
