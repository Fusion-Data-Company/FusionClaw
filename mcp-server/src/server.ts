/**
 * MCP server wiring.
 *
 * The whole security story lives in security/gate.ts. This file's only job is
 * to hand every tool call to the gate instead of straight to the handler, and
 * to keep the tool list honest about what it is offering.
 *
 * v1 read `process.env.MCP_API_KEY` inside the call handler and compared it to
 * itself, which is a check that can never fail. That is gone.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { getAllTools, type ToolDefinition } from "./tools/index.js";
import { loadKeys, presentedToken, resolveKey } from "./security/keys.js";
import { requirementFor, scopeGrants } from "./security/policy.js";
import * as gate from "./security/gate.js";

export const SERVER_NAME = "fusionclaw";
export const SERVER_VERSION = "2.0.0";

let registeredTools: ToolDefinition[] = [];

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  {
    capabilities: { tools: {} },
    instructions:
      "FusionClaw is the business-data layer for this agent: customers, jobs, invoices, expenses, notes and the " +
      "wiki memory, on one Postgres. Call fusionclaw_whoami first — it tells you which of these tools your key may " +
      "actually run, so you can plan inside your scope instead of collecting refusals. Reads are free; writes are " +
      "rate limited; deletes and bulk updates return a preview and a one-time confirm_token before they do anything. " +
      "Every call, allowed or refused, is written to an audit log the operator reads.",
  }
);

/**
 * The client's own name, captured at initialize. It goes in the audit row, so
 * an operator reading the log can tell a Hermes run from an OpenClaw one from
 * a stray Claude Desktop session.
 */
function clientLabel(): string | undefined {
  try {
    const info = server.getClientVersion();
    return info ? `${info.name}@${info.version}` : undefined;
  } catch {
    return undefined;
  }
}

async function registerTools() {
  registeredTools = getAllTools();

  const keys = loadKeys();
  console.error(
    `[fusionclaw-mcp] ${registeredTools.length} tools, ${keys.length} key${keys.length === 1 ? "" : "s"} loaded.`
  );
  if (!keys.length) {
    console.error(
      "[fusionclaw-mcp] NO KEYS CONFIGURED. Every tool call will be refused. " +
        "Run `npx fusionclaw-mcp keygen --name my-agent --scopes read:*` and set FUSIONCLAW_MCP_KEYS."
    );
  }

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // A key only sees the tools it may run. An agent shown 250 tools and
    // allowed 40 spends its context on the 210 it will be refused, and its
    // plan on tools that do not exist for it.
    const key = resolveKey(presentedToken());
    const visible = key
      ? registeredTools.filter((t) => scopeGrants(key.scopes, requirementFor(t.name)))
      : registeredTools;
    return {
      tools: visible.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = registeredTools.find((t) => t.name === name);
    if (!tool) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: { code: "TOOL_NOT_FOUND", message: `Tool '${name}' not found` },
            }),
          },
        ],
      };
    }
    return gate.run(name, (args as Record<string, unknown>) || {}, { client: clientLabel() }, tool.handler);
  });
}

export async function startServer() {
  await registerTools();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[fusionclaw-mcp] ${SERVER_NAME} v${SERVER_VERSION} ready on stdio.`);
}
