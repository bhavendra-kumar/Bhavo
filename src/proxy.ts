import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      const secret = getJwtSecret();
      const { payload } = await jwtVerify(token, secret);
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/user/dashboard", req.url));
      }
      const response = NextResponse.next();
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      return response;
    } catch {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.set(AUTH_COOKIE_NAME, "", { maxAge: 0, path: "/", httpOnly: true });
      return response;
    }
  }

  if (req.nextUrl.pathname.startsWith("/user") || req.nextUrl.pathname.startsWith("/driver")) {
    if (!token) {
      const isDriver = req.nextUrl.pathname.startsWith("/driver");
      return NextResponse.redirect(new URL(isDriver ? "/login?role=driver" : "/login?role=rider", req.url));
    }
    try {
      const secret = getJwtSecret();
      const { payload } = await jwtVerify(token, secret);

      if (payload.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      if (payload.role === "DRIVER" && req.nextUrl.pathname.startsWith("/user")) {
        return NextResponse.redirect(new URL("/driver", req.url));
      }
      if (payload.role !== "DRIVER" && req.nextUrl.pathname.startsWith("/driver")) {
        return NextResponse.redirect(new URL("/user/dashboard", req.url));
      }

      const response = NextResponse.next();
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      return response;
    } catch {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.set(AUTH_COOKIE_NAME, "", { maxAge: 0, path: "/", httpOnly: true });
      return response;
    }
  }

  if (req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/signup") {
    const hasExplicitIntent =
      req.nextUrl.searchParams.has("switch") ||
      req.nextUrl.searchParams.has("registered") ||
      req.nextUrl.searchParams.has("role") ||
      req.nextUrl.searchParams.has("logout");

    if (token && !hasExplicitIntent) {
      try {
        const secret = getJwtSecret();
        const { payload } = await jwtVerify(token, secret);
        const destination =
          payload.role === "ADMIN"
            ? "/admin"
            : payload.role === "DRIVER"
            ? "/driver"
            : "/user/dashboard";
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
