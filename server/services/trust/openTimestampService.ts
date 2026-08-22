export interface OpenTimestampStampResult {
  proofBase64: string;
  stampedAt: string;
  calendars: string[];
}

const CALENDAR_URLS = [
  "https://alice.btc.calendar.opentimestamps.org",
  "https://bob.btc.calendar.opentimestamps.org",
  "https://finney.calendar.eternitywall.com",
  "https://btc.calendar.catallaxy.com",
];

export async function stampSha256ProofHash(proofHashHex: string): Promise<OpenTimestampStampResult | null> {
  const normalized = String(proofHashHex ?? "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    return null;
  }

  try {
    // The published package's CommonJS wrapper is empty. A native dynamic
    // import selects its working ESM export and keeps OTS off the boot path.
    const { submit, write } = await import("@vitrified/typescript-opentimestamps");
    const hash = Uint8Array.from(Buffer.from(normalized, "hex"));
    const { timestamp, errors } = await submit("sha256", hash);
    if (errors.length >= CALENDAR_URLS.length) {
      console.warn("[openTimestampService] all calendars rejected stamp", errors.map((error) => error.message));
      return null;
    }

    const failedCalendars = new Set(
      CALENDAR_URLS.filter((calendar) =>
        errors.some((error) => error.message.includes(calendar)),
      ),
    );
    const bytes = write(timestamp);
    return {
      proofBase64: Buffer.from(bytes).toString("base64"),
      stampedAt: new Date().toISOString(),
      calendars: CALENDAR_URLS.filter((calendar) => !failedCalendars.has(calendar)),
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
