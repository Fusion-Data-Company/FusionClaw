/**
 * Meta tools: what am I allowed to do, and what have agents been doing.
 *
 * `fusionclaw_whoami` exists because the alternative is an agent discovering
 * its boundaries by trying things and collecting refusals, which is slow, fills
 * the audit log with noise, and reads to a watching operator exactly like an
 * agent probing for a way in. One call up front, and the plan is shaped to the
 * key instead of against it.
 */

import { formatResponse } from "../../db/index.js";
import type { ToolDefinition } from "../index.js";
import { currentKey, limiter } from "../../security/gate.js";
import * as audit from "../../security/audit.js";
import { TABLE_CONFIGS } from "../crud/index.js";

export function getMetaTools(): ToolDefinition[] {
  return [
    {
      name: "fusionclaw_whoami",
      description:
        "Report this connection's key name, the scopes it holds, whether destructive tools require confirmation, " +
        "and how much of the rate limit is left. Call this ONCE before planning any sequence of writes — it is " +
        "cheaper and quieter than discovering the boundary by being refused.",
      inputSchema: { type: "object", properties: {} },
      handler: async () => {
        const key = currentKey();
        if (!key) {
          return formatResponse({
            success: false,
            error: { code: "AUTH_INVALID_KEY", message: "No valid key on this connection." },
          });
        }
        const resources = TABLE_CONFIGS.map((c) => c.name);
        const readable = resources.filter((r) => key.scopes.some((s) => s === "*:*" || s === "read:*" || s === `read:${r}` || s === `*:${r}`));
        const writable = resources.filter((r) => key.scopes.some((s) => s === "*:*" || s === "write:*" || s === `write:${r}` || s === `*:${r}`));
        const deletable = resources.filter((r) => key.scopes.some((s) => s === "*:*" || s === "delete:*" || s === `delete:${r}` || s === `*:${r}`));
        return formatResponse({
          success: true,
          key: { id: key.id, name: key.name, legacy: key.legacy },
          scopes: key.scopes,
          confirmationRequiredOnDestructiveTools: key.confirmDestructive,
          rate: limiter.snapshot(key),
          resources: { readable, writable, deletable },
        });
      },
    },
    {
      name: "fusionclaw_audit_tail",
      description:
        "Read the most recent agent audit entries: which key ran which tool, on what resource, and whether it was " +
        "allowed, denied, rate limited or asked to confirm. Every call any agent makes to this server is recorded here, " +
        "including your own and including the ones that were refused.",
      inputSchema: {
        type: "object",
        properties: {
          limit: { type: "integer", description: "Entries to return. Default 25, max 200." },
          key_id: { type: "string", description: "Restrict to one key id." },
        },
      },
      handler: async (args) => {
        const limit = Math.min(Math.max(Number(args.limit) || 25, 1), 200);
        const result = await audit.tail(limit, args.key_id as string | undefined);
        if (!result.available) {
          return formatResponse({
            success: false,
            error: {
              code: "AUDIT_UNAVAILABLE",
              message:
                "The audit table could not be reached, so entries are going to the JSONL fallback file instead. " +
                "Check the server's stderr and FUSIONCLAW_AUDIT_FILE.",
            },
          });
        }
        return formatResponse({ success: true, count: result.rows.length, data: result.rows });
      },
    },
  ];
}
