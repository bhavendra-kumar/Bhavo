import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.AUTH_SECRET || "fallback_secret_please_change_me_in_production"
);

export interface SessionPayload {
  id: string;
  email: string;
  role?: string;
  [key: string]: unknown;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
