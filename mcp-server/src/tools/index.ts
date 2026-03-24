/**
 * Tool Registry
 *
 * Aggregates all tools from CRUD, Query, Analytics, AI, and System categories.
 */

import { getCrudTools } from "./crud/index.js";
import { getQueryTools } from "./query/index.js";
import { getAnalyticsTools } from "./analytics/index.js";
import { getAiTools } from "./ai/index.js";
import { getSystemTools } from "./system/index.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (args: Record<string, unknown>) => Promise<{
    content: Array<{ type: "text"; text: string }>;
  }>;
}

/**
 * Get all registered tools
 */
export function getAllTools(): ToolDefinition[] {
  return [
    ...getCrudTools(),
    ...getQueryTools(),
    ...getAnalyticsTools(),
    ...getAiTools(),
    ...getSystemTools(),
  ];
}
