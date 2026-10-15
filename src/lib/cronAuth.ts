import crypto from "crypto";

export function verifyCronSecret(req: Request): boolean {
  const configuredSecret = process.env.CRON_SECRET;
  if (!configuredSecret || configuredSecret.trim() === "") {
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
