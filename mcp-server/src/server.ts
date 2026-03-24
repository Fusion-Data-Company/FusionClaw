/**
 * MCP Server Setup
 *
 * Registers all tools and handles MCP protocol communication.
 * Uses low-level Server API for JSON Schema compatibility.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { validateApiKey } from "./auth/api-key.js";
import { getAllTools, type ToolDefinition } from "./tools/index.js";

// Store tools for lookup
let registeredTools: ToolDefinition[] = [];

// Create low-level MCP server instance
const server = new Server(
  {
    name: "fusionclaw",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Register all tools with the MCP server
 */
async function registerTools() {
  registeredTools = getAllTools();

  console.error(`[FusionClaw MCP] Registering ${registeredTools.length} tools...`);

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: registeredTools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // Handle tool call requests
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Find the tool
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

    try {
      // Validate API key for all operations
      const apiKey = process.env.MCP_API_KEY;
      if (!apiKey || !validateApiKey(apiKey)) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                success: false,
                error: { code: "AUTH_INVALID_KEY", message: "Invalid or missing API key" },
              }),
            },
          ],
        };
      }

      // Execute the tool handler
      const result = await tool.handler(args || {});
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[FusionClaw MCP] Tool ${name} error:`, errorMessage);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: { code: "TOOL_ERROR", message: errorMessage },
            }),
          },
        ],
      };
    }
  });

  console.error(`[FusionClaw MCP] All tools registered successfully.`);
}

/**
 * Start the MCP server
 */
export async function startServer() {
  console.error("[FusionClaw MCP] Starting server...");

  // Register all tools
  await registerTools();

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("[FusionClaw MCP] Server running. Waiting for connections...");
}
