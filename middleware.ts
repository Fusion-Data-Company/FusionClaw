import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// ─── Route matchers ─────────────────────────────────────────────────────────

const PUBLIC_PATHS = [
  /^\/$/,
  /^\/login(\/.*)?$/,
  /^\/api\/auth\/login$/,
  /^\/api\/auth\/logout$/,
  /^\/api\/google\/callback$/,
  /^\/embed\/.+/,                // tokenized client-portal pages — token in URL is the auth
  /^\/api\/hooks\/.+/,            // inbound webhooks — secret in URL is the auth
  /^\/api\/inbound-emails$/,      // inbound email receiver — for provider webhooks
]
const API_PREFIX = /^\/api\//

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((re) => re.test(pathname))
}

function isApi(pathname: string): boolean {
  return API_PREFIX.test(pathname)
}

// ─── Localhost detection ────────────────────────────────────────────────────

function isLocalhost(req: NextRequest): boolean {
  const host = req.headers.get('host') || ''
  return (
    host.startsWith('localhost:') ||
    host === 'localhost' ||
    host.startsWith('127.0.0.1:') ||
    host === '127.0.0.1' ||
    host.startsWith('[::1]:') ||
    host === '[::1]'
  )
}

// ─── MCP API key validation (Edge-compatible, constant-time) ───────────────

function validateMcpApiKey(key: string): boolean {
  const validKey = process.env.MCP_API_KEY
  if (!validKey) return false
  if (key.length !== validKey.length) return false
  let result = 0
  for (let i = 0; i < key.length; i++) {
    result |= key.charCodeAt(i) ^ validKey.charCodeAt(i)
  }
  return result === 0
}

// ─── Session cookie validation ──────────────────────────────────────────────

const SESSION_COOKIE = 'fc_session'

function getSessionSecret(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    process.env.MCP_API_KEY ||
    process.env.OWNER_PASSWORD ||
    'fusionclaw-dev-only-do-not-use-in-prod'
  return new TextEncoder().encode(secret)
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false
  try {
    await jwtVerify(token, getSessionSecret())
    return true
  } catch {
    return false
  }
}

// ─── Main middleware ────────────────────────────────────────────────────────

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. MCP agent path — API route with valid Bearer token bypasses everything.
  if (isApi(pathname)) {
    const authHeader = req.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const key = authHeader.slice(7)
      if (validateMcpApiKey(key)) return NextResponse.next()
    }
  }

  // 2. Public routes — landing page, login, auth APIs, OAuth callbacks.
  if (isPublic(pathname)) {
    return NextResponse.next()
  }

  // 3. Localhost — trusted, no auth required. lib/auth.getCurrentUser()
  //    will auto-provision and return the singleton owner.
  if (isLocalhost(req)) {
    return NextResponse.next()
  }

  // 4. Deployed: require a valid session cookie.
  if (await hasValidSession(req)) {
    return NextResponse.next()
  }

  // 5. No auth — redirect non-API requests to /login. API requests get 401.
  if (isApi(pathname)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
