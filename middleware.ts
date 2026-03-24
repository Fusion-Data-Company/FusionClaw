import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Paths that don't require authentication
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

// Static asset patterns to skip
const STATIC_PATTERNS = [
  /^\/_next/,
  /^\/favicon\.ico$/,
  /^\/fusionclaw-logo\.png$/,
  /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/,
];

function getJwtSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET || process.env.GATEWAY_PASSWORD || "fusionclaw-dev-secret";
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (STATIC_PATTERNS.some((p) => p.test(pathname))) {
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
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
