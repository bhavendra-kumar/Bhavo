import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.AUTH_SECRET || "fallback_secret_please_change_me_in_production"
);

export async function proxy(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  
  if (req.nextUrl.pathname.startsWith("/user")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      await jwtVerify(token, JWT_SECRET);
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
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL("/user/dashboard", req.url));
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
