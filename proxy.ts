import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";

// Auth protection disabled until production Clerk keys are configured.
// Dev keys (pk_test_) don't work on deployed Vercel URLs.
const clerk = clerkMiddleware();

export function proxy(request: NextRequest, event: NextFetchEvent) {
  return clerk(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
