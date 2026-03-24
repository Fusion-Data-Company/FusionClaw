import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import crypto from "crypto";

// User role type matching the Drizzle enum
export type UserRole = "admin" | "employee";

// Session cookie name
const SESSION_COOKIE = "fusionclaw_session";

// Admin auth ID — single admin gateway auth
const ADMIN_AUTH_ID = "admin_gateway";

// JWT secret derived from SESSION_SECRET or GATEWAY_PASSWORD
// Falls back to dev-only secret in development; throws in production if missing
function getJwtSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || process.env.GATEWAY_PASSWORD;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SESSION_SECRET or GATEWAY_PASSWORD must be set in production");
    }
    return new TextEncoder().encode("fusionclaw-dev-secret");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verify the gateway password using timing-safe comparison.
 */
export function verifyGatewayPassword(password: string): boolean {
  const expected = process.env.GATEWAY_PASSWORD;
  if (!expected) {
    console.warn("GATEWAY_PASSWORD not set in environment");
    return false;
  }
  if (password.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(expected)
  );
}

/**
 * Create a signed JWT session token.
 */
export async function createSessionToken(): Promise<string> {
  return new SignJWT({ authId: ADMIN_AUTH_ID })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

/**
 * Verify a signed JWT session token. Returns the authId if valid, null otherwise.
 */
export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return (payload.authId as string) || null;
  } catch {
    return null;
  }
}

/**
 * Synchronous token verification for middleware (edge runtime compatible).
 * Uses jose's jwtVerify which works in Edge.
 */
export { verifySessionToken as verifySessionTokenAsync };

/**
 * Check if the current request has a valid session.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  return (await verifySessionToken(token)) !== null;
}

/**
 * Get the current admin user from the database.
 * Creates the admin user on first access.
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  // Require a valid session token — middleware protects routes,
  // but this is defense-in-depth to prevent unauthenticated DB access
  if (!token) return null;
  const authId = await verifySessionToken(token);
  if (!authId) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.authId, authId),
  });

  if (existing) return existing;

  // Create admin user on first access
  const [newUser] = await db
    .insert(users)
    .values({
      authId: ADMIN_AUTH_ID,
      email: process.env.ADMIN_EMAIL || "admin@fusionclaw.local",
      name: process.env.ADMIN_NAME || "Admin",
      role: "admin",
    })
    .returning();

  return newUser;
}

/**
 * Require an authenticated user - throws if none found.
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

/**
 * Require a specific role - throws if user doesn't have permission.
 */
export async function requireRole(role: UserRole) {
  const user = await requireUser();
  if (user.role !== role && user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require admin role.
 */
export async function requireAdmin() {
  return requireRole("admin");
}

/**
 * Validate an MCP API key using timing-safe comparison.
 */
export function validateApiKey(key: string): boolean {
  const validKey = process.env.MCP_API_KEY;
  if (!validKey) {
    console.warn("MCP_API_KEY not configured in environment");
    return false;
  }
  if (key.length !== validKey.length) return false;
  return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(validKey));
}

/**
 * Generate a new API key using crypto-secure random bytes.
 */
export function generateApiKey(): string {
  const bytes = crypto.randomBytes(24);
  return `fusionclaw_sk_live_${bytes.toString("base64url")}`;
}
