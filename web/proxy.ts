import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Public routes (no auth needed)
  const publicPaths = ["/login", "/signup", "/api/auth", "/api/health", "/api/ready"];
  if (publicPaths.some((p) => path.startsWith(p))) {
    return NextResponse.next();
  }

  // Static assets
  if (path.startsWith("/_next") || path.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // API routes: return 401 JSON if not authenticated
  if (path.startsWith("/api/")) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { data: null, error: { code: "UNAUTHORIZED", message: "Authentication required", details: null }, meta: {} },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Protected pages: use auth() to check session server-side
  const session = await auth();
  if (!session?.user?.id) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
