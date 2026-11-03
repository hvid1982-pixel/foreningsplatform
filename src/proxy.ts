/**
 * Optimistic route protection: requests for signed-in areas without a session
 * cookie are redirected to login before rendering. This is NOT the security
 * boundary — every page and service verifies the session and permissions on
 * the server (src/server/session.ts, src/modules/<module>/policies.ts).
 */
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const url = new URL("/log-ind", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app", "/kom-i-gang", "/forening/:path*", "/virksomhed/:path*", "/admin/:path*"],
};
