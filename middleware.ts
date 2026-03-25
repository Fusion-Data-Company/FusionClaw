import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Paths that don't require authentication
const PUBLIC_PATHS = ["/", "/login", "/api/auth/login", "/api/auth/logout", "/api/google/callback"];

// Static asset patterns to skip
const STATIC_PATTERNS = [
  /^\/_next/,
  /^\/favicon\.ico$/,
  /^\/fusionclaw-logo\.png$/,
  /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/,
];

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

async function verifyToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return !!payload.authId;
  } catch {
    return false;
  }
}

/**
 * Validate MCP API key for agent access to API routes.
 * Edge-compatible timing-safe comparison using constant-time XOR.
 */
function validateMcpApiKey(key: string): boolean {
  const validKey = process.env.MCP_API_KEY;
  if (!validKey) return false;
  if (key.length !== validKey.length) return false;
  // Constant-time comparison (edge-compatible, no Node crypto needed)
  let result = 0;
  for (let i = 0; i < key.length; i++) {
    result |= key.charCodeAt(i) ^ validKey.charCodeAt(i);
  }
  return result === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (STATIC_PATTERNS.some((p) => p.test(pathname))) {
    return NextResponse.next();
  }

  // Allow public paths (exact match for "/" so /dashboard etc. still require auth)
  if (pathname === "/") return NextResponse.next();
  if (PUBLIC_PATHS.slice(1).some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // For API routes, also accept MCP API key via Authorization header
  if (pathname.startsWith("/api/")) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const apiKey = authHeader.slice(7);
      if (validateMcpApiKey(apiKey)) {
        return NextResponse.next();
      }
    }
  }

  // Check for valid session cookie
  const sessionToken = request.cookies.get("fusionclaw_session")?.value;

  if (!sessionToken || !(await verifyToken(sessionToken))) {
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For page routes, redirect to login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
