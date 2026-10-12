import crypto from "crypto";

/**
 * Validates whether an incoming HTTP request is authorized to invoke a background cron or maintenance worker.
 *
 * Rules:
 * - Requires CRON_SECRET environment variable to be configured and non-empty.
 * - Fails closed (returns false) if CRON_SECRET is missing, empty, or whitespace.
 * - Supports Authorization: Bearer <secret> and x-cron-secret: <secret> headers.
 * - Enforces constant-time comparison via crypto.timingSafeEqual to prevent timing attacks.
 * - Never logs or exposes the secret.
 */
export function verifyCronSecret(req: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret || configuredSecret.trim() === "") {
    // Fail closed if CRON_SECRET is not configured on the server
    return false;
  }

  const authHeader = req.headers.get("authorization");
  let providedToken: string | null = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    providedToken = authHeader.substring(7).trim();
  } else {
    const customHeader = req.headers.get("x-cron-secret");
    if (customHeader) {
      providedToken = customHeader.trim();
    }
  }

  if (!providedToken) {
    return false;
  }

  try {
    const expectedBuffer = Buffer.from(configuredSecret, "utf8");
    const providedBuffer = Buffer.from(providedToken, "utf8");

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}
