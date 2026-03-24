#!/usr/bin/env node
/**
 * FusionClaw MCP Server
 *
 * Provides 234 tools for complete platform control via Model Context Protocol.
 * Connect via Claude Code, OpenClaw, or any MCP-compatible agent.
 */

import { startServer } from "./server.js";

// Validate environment
const requiredEnvVars = ["DATABASE_URL", "MCP_API_KEY"];
const missing = requiredEnvVars.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error("Missing required environment variables:", missing.join(", "));
  console.error("Run 'npm run onboard' to configure FusionClaw.");
  process.exit(1);
}

// Start the server
startServer().catch((err) => {
  console.error("Failed to start MCP server:", err);
  process.exit(1);
});
