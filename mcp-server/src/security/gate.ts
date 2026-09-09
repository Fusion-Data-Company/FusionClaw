/**
 * The gate every tool call passes through.
 *
 * Order matters and is deliberate:
 *   authenticate -> authorise -> rate limit -> confirm -> run -> audit
 *
 * Rate limiting sits AFTER authorisation so a key that is not allowed to
 * delete cannot burn another key's budget probing for tools, and BEFORE the
 * confirmation round trip so a loop cannot mint confirm tokens without limit.
 * Every branch, including the refusals, writes an audit row: a denial nobody
 * recorded is a denial nobody can investigate.
 */

import { presentedToken, resolveKey, type AgentKey } from "./keys.js";
import {
  CONFIRM_TTL_SECONDS,
  issueConfirmToken,
  redeemConfirmToken,
  requirementFor,
  scopeGrants,
  scopeString,
  type Requirement,
} from "./policy.js";
import * as limiter from "./ratelimit.js";
import * as audit from "./audit.js";
import * as preview from "./preview.js";
import { formatResponse } from "../db/index.js";
import { describeError } from "./errors.js";

type ToolResult = { content: Array<{ type: "text"; text: string }> };

export interface GateContext {
  client?: string;
}

function refuse(payload: Record<string, unknown>): ToolResult {
  return formatResponse({ success: false, ...payload });
}

export async function run(
  tool: string,
  args: Record<string, unknown>,
  ctx: GateContext,
  execute: (args: Record<string, unknown>) => Promise<ToolResult>
): Promise<ToolResult> {
  const started = Date.now();
  const req: Requirement = requirementFor(tool);
  const isWrite = req.action !== "read";

  const record = (outcome: audit.Outcome, reason?: string, rowCount?: number, key?: AgentKey | null) =>
    audit.write({
      keyId: key?.id ?? "anonymous",
      keyName: key?.name ?? "unauthenticated",
      client: ctx.client,
      tool,
      action: req.action,
      resource: req.resource,
      outcome,
      reason,
      args,
      rowCount,
      durationMs: Date.now() - started,
    });

  /* 1. authenticate */
  const key = resolveKey(presentedToken());
  if (!key) {
    await record("unauthenticated", "no key resolved", undefined, null);
    return refuse({
      error: {
        code: "AUTH_INVALID_KEY",
        message:
          "No valid FusionClaw key. Set FUSIONCLAW_MCP_KEY in this server's environment to a key minted with " +
          "`npx fusionclaw-mcp keygen`, or set FUSIONCLAW_MCP_KEYS on the server to the key set it printed.",
      },
    });
  }

  /* 2. authorise */
  if (!scopeGrants(key.scopes, req)) {
    await record("denied", `missing ${scopeString(req)}`, undefined, key);
    return refuse({
      error: {
        code: "SCOPE_DENIED",
        message:
          `This key ("${key.name}") is not allowed to run ${tool}. It ${req.effect} and needs the scope ` +
          `${scopeString(req)}. This key holds: ${key.scopes.join(", ")}. Do not retry — ask the operator to ` +
          "widen the key, or use a tool inside the granted scopes.",
        required: scopeString(req),
        granted: key.scopes,
      },
    });
  }

  /* 3. rate limit */
  const rate = limiter.check(key, isWrite);
  if (!rate.ok) {
    await record("rate_limited", rate.reason, undefined, key);
    return refuse({
      error: {
        code: "RATE_LIMITED",
        message:
          `Rate limit "${rate.reason}" reached for key "${key.name}". Wait ${Math.ceil((rate.retryAfterMs ?? 0) / 1000)}s ` +
          "and retry, or batch this work — a bulk tool costs one call instead of fifty.",
        retryAfterMs: rate.retryAfterMs,
      },
    });
  }

  /* 4. confirm */
  if (req.destructive && key.confirmDestructive) {
    const token = typeof args.confirm_token === "string" ? args.confirm_token : undefined;
    if (!token) {
      const p = await preview.build(tool, req, args);
      const issued = issueConfirmToken(tool, args, key.id);
      await record("confirm_required", p.summary, p.affected, key);
      return refuse({
        error: {
          code: "CONFIRMATION_REQUIRED",
          message:
            `${p.summary} Nothing has changed yet. To go through, call ${tool} again with the SAME arguments plus ` +
            `confirm_token. The token expires in ${CONFIRM_TTL_SECONDS} seconds and only matches these arguments.`,
        },
        preview: p,
        confirm_token: issued,
        expires_in_seconds: CONFIRM_TTL_SECONDS,
      });
    }
    const verdict = redeemConfirmToken(token, tool, args, key.id);
    if (verdict !== "ok") {
      await record("denied", `confirm token ${verdict}`, undefined, key);
      return refuse({
        error: {
          code: "CONFIRMATION_INVALID",
          message:
            verdict === "expired"
              ? "That confirm_token has expired. Call again without it to get a fresh preview and token."
              : verdict === "mismatch"
                ? "That confirm_token was issued for different arguments or a different key. Tokens are bound to the exact call they previewed. Call again without it."
                : "That confirm_token is not recognised. It may already have been used — each one works once.",
        },
      });
    }
  }

  /* 5. run */
  try {
    const result = await execute(args);
    let rowCount: number | undefined;
    try {
      const parsed = JSON.parse(result.content?.[0]?.text ?? "{}");
      rowCount =
        typeof parsed.count === "number"
          ? parsed.count
          : typeof parsed.deleted === "number"
            ? parsed.deleted
            : Array.isArray(parsed.data)
              ? parsed.data.length
              : parsed.data
                ? 1
                : undefined;
    } catch {
      /* a tool may legitimately return prose */
    }
    await record("ok", undefined, rowCount, key);
    return result;
  } catch (err) {
    const message = describeError(err);
    await record("error", message, undefined, key);
    return refuse({ error: { code: "TOOL_ERROR", message } });
  }
}

export function currentKey(): AgentKey | null {
  return resolveKey(presentedToken());
}

export { limiter };
