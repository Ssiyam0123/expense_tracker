import { NextRequest, NextResponse } from "next/server";

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const origin = req.headers.get("origin") || "*";

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Define public routes
  const publicPaths = ["/login", "/signup", "/api/auth", "/api/health", "/api/ready", "/api/v1/signup"];
  let response: NextResponse;

  if (publicPaths.some((p) => path.startsWith(p))) {
    response = NextResponse.next();
  } else if (path.startsWith("/_next") || path.startsWith("/favicon") || path === "/logo.png" || path === "/icon.png") {
    response = NextResponse.next();
  } else {
    // Check for NextAuth session cookies
    const sessionToken =
      req.cookies.get("authjs.session-token")?.value ||
      req.cookies.get("__Secure-authjs.session-token")?.value;

    // Check for Mobile Bearer token
    const authHeader = req.headers.get("authorization");
    const hasBearerToken = authHeader && authHeader.startsWith("Bearer ");

    const isAuthorized = sessionToken || hasBearerToken;

    if (path.startsWith("/api/")) {
      // API routes auth check
      if (!isAuthorized) {
        response = NextResponse.json(
          { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required", details: null }, meta: {} },
          { status: 401 }
        );
      } else {
        response = NextResponse.next();
      }
    } else {
      // Protected pages auth check
      if (!isAuthorized) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", path);
        response = NextResponse.redirect(loginUrl);
      } else {
        response = NextResponse.next();
      }
    }
  }

  // Add CORS headers for all API requests
  if (path.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
