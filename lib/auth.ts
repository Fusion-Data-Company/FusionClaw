import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'

// User role type matching the Drizzle enum
export type UserRole = 'admin' | 'employee'

// ─── Cookie / session config ────────────────────────────────────────────────

const SESSION_COOKIE = 'fc_session'
const SESSION_TTL_DAYS = 30

/**
 * Returns the secret used to sign session JWTs.
 * Uses MCP_API_KEY as a fallback so no extra env var is required for self-host.
 * (Reusing it is safe — the JWT payload is non-sensitive, the secret only
 * authenticates the server's own tokens.)
 */
function getSessionSecret(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.MCP_API_KEY ||
    process.env.OWNER_PASSWORD
  if (!secret) {
    throw new Error('SESSION_SECRET (or MCP_API_KEY / OWNER_PASSWORD) must be set in environment')
  }
  return new TextEncoder().encode(secret)
}

// ─── Localhost detection ─────────────────────────────────────────────────────

/**
 * True when the current request is from localhost / 127.0.0.1.
 * Localhost is trusted — no auth required. The user is sitting at the machine.
 */
export async function isLocalhostRequest(): Promise<boolean> {
  const headerList = await headers()
  const host = headerList.get('host') || ''
  return (
    host.startsWith('localhost:') ||
    host === 'localhost' ||
    host.startsWith('127.0.0.1:') ||
    host === '127.0.0.1' ||
    host.startsWith('[::1]:') ||
    host === '[::1]'
  )
}

// ─── Owner provisioning ──────────────────────────────────────────────────────

const OWNER_AUTH_ID = 'owner'

/**
 * Returns the single 'owner' user, creating it on first call.
 * In single-user / localhost mode, this is the user every request authenticates as.
 */
export async function getOrCreateOwner() {
  const existing = await db.query.users.findFirst({
    where: eq(users.authId, OWNER_AUTH_ID),
  })
  if (existing) return existing

  const [created] = await db
    .insert(users)
    .values({
      authId: OWNER_AUTH_ID,
      email: process.env.OWNER_EMAIL || 'owner@localhost',
      name: process.env.OWNER_NAME || 'Owner',
      role: 'admin',
    })
    .returning()
  return created
}

// ─── Session token (JWT in HttpOnly cookie) ─────────────────────────────────

interface SessionPayload {
  uid: string // user id
  [key: string]: unknown
}

export async function signSession(userId: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_DAYS * 24 * 60 * 60
  return await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(getSessionSecret())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret())
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function setSessionCookie(userId: string) {
  const token = await signSession(userId)
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

async function readSessionUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const payload = await verifySession(token)
  if (!payload?.uid) return null
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, payload.uid as string),
  })
  return dbUser ?? null
}

// ─── Public API: who is the current user? ────────────────────────────────────

/**
 * Returns the current user, or null if unauthenticated.
 *
 * Resolution order:
 *  1. Localhost request → return the singleton owner (no auth needed).
 *  2. Valid session cookie → return the user the cookie points at.
 *  3. Otherwise → null.
 *
 * Self-host on localhost just works. Deployed instances require a session
 * cookie (set after the user submits OWNER_PASSWORD on /login) or an employee
 * cookie (issued via invite link from the admin).
 */
export async function getCurrentUser() {
  if (await isLocalhostRequest()) {
    return await getOrCreateOwner()
  }
  return await readSessionUser()
}

/**
 * Require an authenticated user — redirects to /login if none.
 */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Require admin role — redirects to /dashboard if not admin.
 */
export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'admin') redirect('/dashboard')
  return user
}

/**
 * Require a specific role — redirects to /dashboard if insufficient.
 * Admin role satisfies any role requirement.
 */
export async function requireRole(role: UserRole) {
  const user = await requireUser()
  if (user.role !== role && user.role !== 'admin') redirect('/dashboard')
  return user
}

// ─── OWNER_PASSWORD validation (deployed mode only) ──────────────────────────

/**
 * Validate the submitted password against OWNER_PASSWORD.
 * Returns the owner user if it matches, null otherwise.
 *
 * Constant-time comparison to avoid timing attacks.
 */
export async function validateOwnerPassword(submitted: string) {
  const expected = process.env.OWNER_PASSWORD
  if (!expected) {
    // No password configured — only localhost should be reaching here in practice,
    // and middleware handles the localhost short-circuit. If this is hit, deny.
    return null
  }
  if (submitted.length !== expected.length) return null
  const submittedBytes = Buffer.from(submitted)
  const expectedBytes = Buffer.from(expected)
  if (submittedBytes.length !== expectedBytes.length) return null
  if (!crypto.timingSafeEqual(submittedBytes, expectedBytes)) return null
  return await getOrCreateOwner()
}

// ─── MCP API key (agents) ────────────────────────────────────────────────────

/**
 * Validate an MCP API key using Node.js timing-safe comparison.
 * For use in API route handlers (Node runtime) only.
 * Middleware uses its own Edge-compatible inline check.
 */
export function validateApiKey(key: string): boolean {
  const validKey = process.env.MCP_API_KEY
  if (!validKey) {
    console.warn('MCP_API_KEY not configured in environment')
    return false
  }
  if (key.length !== validKey.length) return false
  return crypto.timingSafeEqual(Buffer.from(key), Buffer.from(validKey))
}

/**
 * Generate a new MCP API key using crypto-secure random bytes.
 */
export function generateApiKey(): string {
  const bytes = crypto.randomBytes(24)
  return `fusionclaw_sk_live_${bytes.toString('base64url')}`
}
