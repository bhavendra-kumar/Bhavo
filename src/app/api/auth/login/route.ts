import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { signAuthToken, getAuthCookieOptions } from "@/lib/auth";
import { loginRateLimiter, getLoginRateLimitKey } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, role: requestedRole } = body;

    if (!email || !password) {
      return NextResponse.json(
        { status: "error", message: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

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
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

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

    await loginRateLimiter.reset(rateKey);

    const rawRole = user.role || "RIDER";
    const trustedRole = rawRole === "USER" ? "RIDER" : rawRole;

    if (requestedRole && typeof requestedRole === "string") {
      const normalizedReqRole = requestedRole.trim().toUpperCase();
      if (normalizedReqRole === "DRIVER" && trustedRole !== "DRIVER" && trustedRole !== "ADMIN") {
        return NextResponse.json(
          {
            status: "error",
            code: "ROLE_MISMATCH",
            message: "This account is registered as a Rider. Please switch to the 'Login as Rider' tab to sign in.",
            accountRole: "RIDER",
          },
          { status: 403 }
        );
      }
      if ((normalizedReqRole === "RIDER" || normalizedReqRole === "USER") && trustedRole === "DRIVER") {
        return NextResponse.json(
          {
            status: "error",
            code: "ROLE_MISMATCH",
            message: "This account is registered as a Bhavo Captain (Driver). Please switch to the 'Login as Driver' tab to sign in.",
            accountRole: "DRIVER",
          },
          { status: 403 }
        );
      }
    }

    const userTokenVersion = (userAny.tokenVersion as number) ?? 0;

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
