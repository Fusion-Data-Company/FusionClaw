/**
 * API Key Authentication
 *
 * Validates API keys for MCP tool access.
 */

/**
 * Validate an API key against the configured key
 */
export function validateApiKey(key: string): boolean {
  const validKey = process.env.MCP_API_KEY;
  if (!validKey) {
    console.error("[FusionClaw MCP] MCP_API_KEY not configured");
    return false;
  }
  return key === validKey;
}

/**
 * Check if a key has a specific permission
 * For now, all valid keys have full access (super admin)
 */
export function hasPermission(_key: string, _permission: string): boolean {
  // Super admin key has all permissions
  return true;
}

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "fusionclaw_sk_live_";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}
