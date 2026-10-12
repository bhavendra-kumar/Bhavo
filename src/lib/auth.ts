import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { NextResponse } from "next/server";

export interface SessionPayload {
  id: string;
  email: string;
  role?: string;
  tokenVersion?: number;
  [key: string]: unknown;
}

export interface CookieOptions {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge?: number;
  expires?: Date;
}

export const AUTH_COOKIE_NAME = "auth_token";

/**
 * Custom error class for centralized authentication and authorization failures.
 */
export class AuthError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 401, code = "UNAUTHORIZED") {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return (
    error instanceof AuthError ||
    (typeof error === "object" && error !== null && "statusCode" in error && "code" in error)
  );
}

export function handleAuthError(error: unknown): NextResponse {
  if (isAuthError(error)) {
    return NextResponse.json(
      { status: "error", code: error.code, message: error.message },
      { status: error.statusCode }
    );
  }
  return NextResponse.json(
    { status: "error", code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
    { status: 500 }
  );
}

/**
 * Resolves the JWT secret from environment variables.
 * Fails fast with a clear error if neither JWT_SECRET nor AUTH_SECRET is configured.
 * Never falls back to a hardcoded string.
 */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret || typeof secret !== "string" || secret.trim().length === 0) {
    throw new Error(
      "FATAL: JWT_SECRET or AUTH_SECRET is not configured or is empty. Server authentication cannot proceed securely."
    );
  }
  return new TextEncoder().encode(secret.trim());
}

/**
 * Standard secure cookie options for session token storage.
 */
export function getAuthCookieOptions(token = "", maxAgeSeconds = 60 * 60 * 24 * 7): CookieOptions {
  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/**
 * Clear cookie options to invalidate user session on logout.
 */
export function getClearAuthCookieOptions(): CookieOptions {
  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  };
}

/**
 * Signs a new JWT for an authenticated user.
 * Embeds tokenVersion for immediate server-side session invalidation.
 */
export async function signAuthToken(
  payload: { id: string; email: string; role: string; tokenVersion?: number; [key: string]: unknown },
  expiresIn = "7d"
): Promise<string> {
  const secret = getJwtSecret();
  const alg = "HS256";
  const tokenPayload = {
    ...payload,
    tokenVersion: payload.tokenVersion ?? 0,
  };
  return await new SignJWT(tokenPayload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

/**
 * Cryptographically verifies and validates a JWT token string.
 * Throws an AuthError if missing, malformed, expired, or invalid.
 */
export async function verifyAuthToken(token: string): Promise<SessionPayload> {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    throw new AuthError("Missing authentication token", 401, "TOKEN_MISSING");
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    throw new AuthError("Malformed authentication token", 401, "TOKEN_MALFORMED");
  }

  const secret = getJwtSecret();

  try {
    const { payload } = await jwtVerify(token.trim(), secret);
    if (!payload || typeof payload !== "object") {
      throw new AuthError("Invalid token payload", 401, "TOKEN_INVALID");
    }

    const sessionPayload = payload as unknown as SessionPayload;
    if (!sessionPayload.id || !sessionPayload.email) {
      throw new AuthError("Invalid token structure: missing id or email", 401, "TOKEN_INVALID");
    }

    return sessionPayload;
  } catch (err: unknown) {
    if (err instanceof AuthError) throw err;
    const msg = (err as Error)?.message || "";
    const code = (err as { code?: string })?.code;
    if (msg.includes("expired") || code === "ERR_JWT_EXPIRED") {
      throw new AuthError("Authentication token expired", 401, "TOKEN_EXPIRED");
    }
    throw new AuthError("Invalid authentication token", 401, "TOKEN_INVALID");
  }
}

/**
 * Extracts and verifies the session from cookie or Authorization header.
 * Returns null if missing or invalid (non-throwing helper).
 */
export async function getSession(req?: Request): Promise<SessionPayload | null> {
  try {
    let token: string | undefined;

    try {
      const cookieStore = await cookies();
      token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    } catch {
      // Cookies store unavailable in direct request context
    }

    if (!token && req) {
      const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      }
      if (!token) {
        const cookieHeader = req.headers.get("cookie");
        if (cookieHeader) {
          const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]*)`));
          if (match) token = decodeURIComponent(match[1]);
        }
      }
    }

    if (!token) return null;
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}

/**
 * Requires a valid authenticated user session.
 * Loads fresh user from MongoDB and enforces:
 * 1. Active account status (SUSPENDED / DISABLED accounts are rejected with 403).
 * 2. Token version matching (stale or revoked tokens are rejected with 401).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requireAuth(req?: Request): Promise<any> {
  let token: string | undefined;

  try {
    const cookieStore = await cookies();
    token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  } catch {
    // Cookies store unavailable in non-page context
  }

  if (!token && req) {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
    if (!token) {
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE_NAME}=([^;]*)`));
        if (match) token = decodeURIComponent(match[1]);
      }
    }
  }

  if (!token) {
    throw new AuthError("Authentication required: No auth token provided", 401, "UNAUTHORIZED");
  }

  const payload = await verifyAuthToken(token);

  const dbConnectModule = await import("@/lib/mongoose");
  await dbConnectModule.default();

  const userModelModule = await import("@/models/User");
  const User = userModelModule.default;

  const user = await User.findById(payload.id);
  if (!user) {
    throw new AuthError("Unauthorized: User account not found or deactivated", 401, "USER_NOT_FOUND");
  }

  // Account status check (suspended / disabled)
  const userAny = user as Record<string, unknown>;
  const userStatus = (userAny.status as string) || "ACTIVE";
  if (
    userStatus === "SUSPENDED" ||
    userStatus === "DISABLED" ||
    userAny.isSuspended === true ||
    userAny.isDisabled === true
  ) {
    throw new AuthError("Access denied: Account is suspended or disabled", 403, "ACCOUNT_SUSPENDED");
  }

  // Session / Token version check (revocation mechanism)
  const userTokenVersion = (userAny.tokenVersion as number) ?? 0;
  const tokenVersionInJwt = (payload.tokenVersion as number) ?? 0;

  if (tokenVersionInJwt !== userTokenVersion) {
    throw new AuthError("Unauthorized: Session has been revoked. Please log in again.", 401, "TOKEN_REVOKED");
  }

  return user;
}

/**
 * Requires an authenticated user with one of the allowed roles.
 * Throws AuthError (401 if unauthenticated, 403 if insufficient role).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requireRole(allowedRoles: string | string[], req?: Request): Promise<any> {
  const user = await requireAuth(req);
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  const effectiveRole = user.role;
  const isMatch = roles.some((r) => {
    if (r === "RIDER") return effectiveRole === "RIDER" || effectiveRole === "USER";
    return effectiveRole === r;
  });

  if (!isMatch) {
    throw new AuthError(
      `Forbidden: Required role ${roles.join(" or ")}, but account role is ${effectiveRole}`,
      403,
      "FORBIDDEN"
    );
  }

  return user;
}

/**
 * Requires an authenticated user with ADMIN role.
 * Throws AuthError (401 if unauthenticated/expired/revoked, 403 if not ADMIN).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requireAdmin(req?: Request): Promise<any> {
  return await requireRole("ADMIN", req);
}

/**
 * Increments the user's tokenVersion in the database, immediately invalidating
 * all previously issued JWT tokens across all devices.
 */
export async function revokeUserSessions(userId: string): Promise<number> {
  const dbConnectModule = await import("@/lib/mongoose");
  await dbConnectModule.default();

  const userModelModule = await import("@/models/User");
  const User = userModelModule.default;

  const user = await User.findById(userId);
  if (!user) {
    throw new AuthError("Unauthorized: User not found", 401, "USER_NOT_FOUND");
  }

  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  return user.tokenVersion;
}
