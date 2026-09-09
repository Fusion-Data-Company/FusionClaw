/**
 * Node's `String(err)` on a Neon/undici error yields "[object ErrorEvent]",
 * which is the least useful string in the language and was appearing verbatim
 * in audit rows and in messages an agent reads back. This turns whatever the
 * driver threw into something a human can act on.
 */
export function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    const parts = [o.message, o.reason, o.error, o.type, o.code]
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    const nested = o.error && typeof o.error === "object" ? describeError(o.error) : "";
    const joined = [...parts, nested].filter(Boolean).join(": ");
    if (joined) return joined;
    try {
      return JSON.stringify(o);
    } catch {
      return Object.prototype.toString.call(o);
    }
  }
  return String(err);
}
