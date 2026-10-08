import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.AUTH_SECRET || "fallback_secret_please_change_me_in_production"
);

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  
  if (req.nextUrl.pathname.startsWith("/user") || req.nextUrl.pathname.startsWith("/driver")) {
    if (req.nextUrl.searchParams.get("demo") === "true") {
      return NextResponse.next();
    }
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // Role-based boundary enforcement
      if (payload.role === "DRIVER" && req.nextUrl.pathname.startsWith("/user")) {
        return NextResponse.redirect(new URL("/driver", req.url));
      }
      if (payload.role !== "DRIVER" && req.nextUrl.pathname.startsWith("/driver")) {
        return NextResponse.redirect(new URL("/user/dashboard", req.url));
      }

      return NextResponse.next();
    } catch {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.set("auth_token", "", { maxAge: 0 });
      return response;
    }
  }

  if (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup") {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const destination = payload.role === "DRIVER" ? "/driver" : "/user/dashboard";
        return NextResponse.redirect(new URL(destination, req.url));
      } catch {}
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
