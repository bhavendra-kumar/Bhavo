import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { signAuthToken, getAuthCookieOptions } from "@/lib/auth";
import { loginRateLimiter, getLoginRateLimitKey } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { status: "error", message: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. IP + Account Rate Limiting Check
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const rateKey = getLoginRateLimitKey(ip, normalizedEmail);
    const rateCheck = await loginRateLimiter.check(rateKey);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          status: "error",
          code: "TOO_MANY_REQUESTS",
          message: "Too many failed login attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds || 60),
          },
        }
      );
    }

    await dbConnect();
    // Search with case-insensitive matching to find user
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

    // Generic error response to avoid account enumeration
    if (!user || !user.password) {
      await loginRateLimiter.recordFailure(rateKey);
      return NextResponse.json(
        { status: "error", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      await loginRateLimiter.recordFailure(rateKey);
      return NextResponse.json(
        { status: "error", message: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Account status validation
    const userAny = user as Record<string, unknown>;
    const userStatus = (userAny.status as string) || "ACTIVE";
    if (
      userStatus === "SUSPENDED" ||
      userStatus === "DISABLED" ||
      userAny.isSuspended === true ||
      userAny.isDisabled === true
    ) {
      return NextResponse.json(
        { status: "error", code: "ACCOUNT_SUSPENDED", message: "Account is suspended or disabled" },
        { status: 403 }
      );
    }

    // On successful login, clear failure counter for this IP + account
    await loginRateLimiter.reset(rateKey);

    // Finding 4 fix: Server strictly preserves stored role from trusted DB record.
    // Client input CANNOT mutate stored role.
    const trustedRole = user.role || "RIDER";
    const userTokenVersion = (userAny.tokenVersion as number) ?? 0;

    // Generate JWT token with embedded tokenVersion for immediate server-side revocation
    const jwt = await signAuthToken({
      id: user._id.toString(),
      email: user.email,
      role: trustedRole,
      tokenVersion: userTokenVersion,
    });

    const response = NextResponse.json(
      {
        status: "success",
        message: "Logged in successfully",
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: trustedRole,
        },
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookie using centralized cookie configuration
    response.cookies.set(getAuthCookieOptions(jwt));

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
