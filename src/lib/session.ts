import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// Lightweight, dependency-free session handling.
//
// The session cookie holds `<userId>.<hmac>` where the HMAC is signed with
// SESSION_SECRET. This is enough to authenticate seeded users for the
// assessment without pulling in a full auth framework. A production system
// would use short-lived, rotated tokens (e.g. NextAuth / a real IdP) — see
// ARCHITECTURE.md.

const COOKIE_NAME = "ajaia_session";
const SECRET = process.env.SESSION_SECRET || "insecure-dev-secret";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function sign(userId: string): string {
  const hmac = crypto.createHmac("sha256", SECRET).update(userId).digest("hex");
  return `${userId}.${hmac}`;
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const userId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(userId)
    .digest("hex");
  // Constant-time comparison to avoid leaking signature bytes via timing.
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return userId;
}

export async function createSession(userId: string): Promise<void> {
  cookies().set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function destroySession(): void {
  cookies().delete(COOKIE_NAME);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

/** Returns the logged-in user, or null if there is no valid session. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = verify(token);
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
  return user;
}

/** For internal use/testing: expose signing so tests can build tokens. */
export const _internal = { sign, verify };
