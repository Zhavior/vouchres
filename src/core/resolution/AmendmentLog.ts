export interface AmendmentLogEntry {
  market: string;
  fromVersion: string;
  toVersion: string;
  publishedAt: string;
  reason: string;
  retroactive: false;
}
