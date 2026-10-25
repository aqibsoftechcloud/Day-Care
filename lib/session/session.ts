import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { decryptUserId, encryptUserId, InvalidUserIdError } from "@/lib/user-id";
import { sessionCookieOptions } from "./cookie-options";
import { signSessionToken, verifySessionToken } from "./token";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

export class UnauthenticatedError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "UnauthenticatedError";
  }
}

export type SafeSessionUser = {
  user_id: string;
  name: string;
  email: string;
  status: string;
  role: { id: number; name: string };
};

type SessionUserRecord = {
  id: number;
  session_version?: number;
  name: string;
  email: string;
  status: string;
  roles: { id: number; name: string };
};

const sessionUserSelect = {
  id: true,
  name: true,
  email: true,
  status: true,
  session_version: true,
  roles: { select: { id: true, name: true } },
} as const;

export function toSafeSessionUser(user: SessionUserRecord): SafeSessionUser {
  return {
    user_id: encryptUserId(user.id),
    name: user.name,
    email: user.email,
    status: user.status,
    role: user.roles,
  };
}

/**
 * Creates a session for the given (already-authenticated) user id. No
 * session table exists in the schema — per instruction, none was added —
 * so the session is represented entirely by a signed, expiring JWT
 * carried in an HttpOnly cookie. The token only ever carries the user's
 * encrypted external id, never role/status/permissions, so every request
 * re-reads authoritative role/status from the database instead of
 * trusting anything cached in the cookie.
 */
export async function createSession(userId: number): Promise<void> {
  const record = await prisma.users.findUnique({ where: { id: userId }, select: { session_version: true } });

  if (!record) {
    throw new UnauthenticatedError();
  }

  const token = await signSessionToken(
    { sub: encryptUserId(userId), sv: record.session_version },
    SESSION_MAX_AGE_SECONDS
  );

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(SESSION_MAX_AGE_SECONDS));
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  // Expire with the same attributes it was set with (HttpOnly/Secure/SameSite/Path), not a bare delete.
  cookieStore.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions(0), maxAge: 0, expires: new Date(0) });
}

/**
 * Revokes every outstanding session of a user: tokens embed the version
 * they were issued at, and `getCurrentUser` rejects any mismatch. Used by
 * logout, password changes and any "sign out everywhere" action.
 */
export async function revokeUserSessions(userId: number): Promise<void> {
  await prisma.users.update({ where: { id: userId }, data: { session_version: { increment: 1 } }, select: { id: true } });
}

/**
 * Logout. The token is a stateless JWT, so clearing the cookie alone would
 * leave a copied token valid until expiry; the user's session version is
 * bumped too, which ends ALL of that user's sessions (every browser/device).
 * Safe to call with no/invalid/stale session (idempotent): the cookie is
 * always cleared, and only a token that still verifies revokes anything.
 */
export async function invalidateSession(): Promise<void> {
  try {
    const userId = await getSessionUserId();

    if (userId !== null) {
      await revokeUserSessions(userId);
    }
  } finally {
    await clearSessionCookie();
  }
}

/** The user id inside the request's session cookie if its signature, expiry, id AND version all verify; otherwise null. */
async function getSessionUserId(): Promise<number | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  const payload = token ? await verifySessionToken(token) : null;

  if (!payload) {
    return null;
  }

  let userId: number;

  try {
    userId = decryptUserId(payload.sub);
  } catch (error) {
    if (error instanceof InvalidUserIdError) {
      return null;
    }
    throw error;
  }

  const record = await prisma.users.findUnique({ where: { id: userId }, select: { session_version: true } });

  return record && record.session_version === payload.sv ? userId : null;
}

/**
 * Resolves the current request's authenticated user, or `null` if there
 * is no session, the token is invalid/expired/tampered, the referenced
 * user no longer exists, or the user's status is not currently "active".
 * Role and status are always read fresh from the database here — never
 * trusted from the token — so a user deactivated after their session was
 * created loses access on their very next request.
 */
export async function getCurrentUser(): Promise<SafeSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);

  if (!payload) {
    return null;
  }

  let userId: number;

  try {
    userId = decryptUserId(payload.sub);
  } catch (error) {
    if (error instanceof InvalidUserIdError) {
      return null;
    }
    throw error;
  }

  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: sessionUserSelect,
  });

  if (!user || user.status !== "active" || user.session_version !== payload.sv) {
    return null;
  }

  return toSafeSessionUser(user);
}

export async function requireAuthenticatedUser(): Promise<SafeSessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthenticatedError();
  }

  return user;
}
