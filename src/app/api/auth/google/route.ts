import { NextResponse } from "next/server";
import crypto from "crypto";
import { hash } from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { signAuthToken, getAuthCookieOptions } from "@/lib/auth";

interface TokenInfoResponse {
  iss?: string;
  sub?: string;
  azp?: string;
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  exp?: string | number;
  error_description?: string;
}

interface FirebaseLookupResponse {
  users?: Array<{
    localId: string;
    email: string;
    displayName?: string;
    photoUrl?: string;
    emailVerified?: boolean;
  }>;
  error?: {
    message: string;
  };
}

async function verifyGoogleIdToken(token: string): Promise<{
  email: string;
  name: string;
  picture?: string;
  sub: string;
} | null> {
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`, {
      method: "GET",
    });

    if (!res.ok) {
      return null;
    }

    const data: TokenInfoResponse = await res.json();
    if (!data.email) {
      return null;
    }

    const isVerified = data.email_verified === "true" || data.email_verified === true;
    if (!isVerified) {
      return null;
    }

    const expectedAud = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    if (expectedAud && data.aud !== expectedAud && data.azp !== expectedAud) {
      console.warn("[Google Auth] Warning: Audience mismatch with configured Google Client ID");
    }

    return {
      email: data.email.toLowerCase().trim(),
      name: data.name || data.email.split("@")[0],
      picture: data.picture,
      sub: data.sub || "",
    };
  } catch (err) {
    console.error("[Google Auth] Error verifying Google ID Token:", err);
    return null;
  }
}

async function verifyFirebaseIdToken(token: string): Promise<{
  email: string;
  name: string;
  picture?: string;
  sub: string;
} | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!res.ok) {
      return null;
    }

    const data: FirebaseLookupResponse = await res.json();
    const userRecord = data.users?.[0];
    if (!userRecord || !userRecord.email) {
      return null;
    }

    return {
      email: userRecord.email.toLowerCase().trim(),
      name: userRecord.displayName || userRecord.email.split("@")[0],
      picture: userRecord.photoUrl,
      sub: userRecord.localId,
    };
  } catch (err) {
    console.error("[Google Auth] Error verifying Firebase ID Token:", err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      firebaseIdToken,
      googleIdToken,
      role: requestedRole,
      clientEmail,
      clientName,
      clientPhoto,
    } = body;

    if (!firebaseIdToken && !googleIdToken) {
      return NextResponse.json(
        { status: "error", message: "Missing authentication token" },
        { status: 400 }
      );
    }

    let verifiedUser: { email: string; name: string; picture?: string; sub: string } | null = null;

    if (googleIdToken) {
      verifiedUser = await verifyGoogleIdToken(googleIdToken);
    }

    if (!verifiedUser && firebaseIdToken) {
      verifiedUser = await verifyFirebaseIdToken(firebaseIdToken);
    }

    // In development mode, if Firebase API keys are placeholders and both online verifications fail,
    // allow client-provided verified info as fallback for seamless local testing
    if (!verifiedUser && process.env.NODE_ENV !== "production" && clientEmail) {
      console.warn("[Google Auth] Using local development fallback verification");
      verifiedUser = {
        email: String(clientEmail).toLowerCase().trim(),
        name: clientName || String(clientEmail).split("@")[0],
        picture: clientPhoto || undefined,
        sub: "dev-google-" + crypto.randomBytes(8).toString("hex"),
      };
    }

    if (!verifiedUser || !verifiedUser.email) {
      return NextResponse.json(
        { status: "error", message: "Google authentication verification failed. Invalid or expired token." },
        { status: 401 }
      );
    }

    await dbConnect();
    const normalizedEmail = verifiedUser.email;

    let user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    });

    const normalizedReqRole = requestedRole === "DRIVER" ? "DRIVER" : "RIDER";

    if (user) {
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

      const rawRole = user.role || "RIDER";
      const trustedRole = rawRole === "USER" ? "RIDER" : rawRole;

      if (normalizedReqRole === "DRIVER" && trustedRole !== "DRIVER" && trustedRole !== "ADMIN") {
        return NextResponse.json(
          {
            status: "error",
            code: "ROLE_MISMATCH",
            message: "This Google account is registered as a Rider. Please continue under 'Login as Rider'.",
            accountRole: "RIDER",
          },
          { status: 403 }
        );
      }

      if (normalizedReqRole === "RIDER" && trustedRole === "DRIVER") {
        return NextResponse.json(
          {
            status: "error",
            code: "ROLE_MISMATCH",
            message: "This Google account is registered as a Bhavo Captain (Driver). Please switch to 'Login as Driver'.",
            accountRole: "DRIVER",
          },
          { status: 403 }
        );
      }

      if (verifiedUser.picture && !user.avatar) {
        user.avatar = verifiedUser.picture;
      }
      if (!user.googleId && verifiedUser.sub) {
        user.googleId = verifiedUser.sub;
      }
      if (user.authProvider !== "GOOGLE") {
        user.authProvider = "GOOGLE";
      }
      await user.save();
    } else {
      const randomPassword = crypto.randomUUID() + "-" + crypto.randomBytes(32).toString("hex");
      const hashedPassword = await hash(randomPassword, 12);

      user = await User.create({
        name: verifiedUser.name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        password: hashedPassword,
        role: normalizedReqRole,
        avatar: verifiedUser.picture || null,
        authProvider: "GOOGLE",
        googleId: verifiedUser.sub || null,
        status: "ACTIVE",
      });
    }

    const trustedRole = (user.role === "USER" ? "RIDER" : user.role) || "RIDER";
    const userAny = user as Record<string, unknown>;
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
        message: "Authenticated successfully with Google",
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
    console.error("Google Auth Route Error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error during Google authentication" },
      { status: 500 }
    );
  }
}
