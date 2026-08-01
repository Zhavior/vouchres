export type RedisErrorKind =
  | "quota"
  | "timeout"
  | "network"
  | "http"
  | "unknown";

export class RedisError extends Error {
  constructor(
    public readonly kind: RedisErrorKind,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "RedisError";
  }
}
