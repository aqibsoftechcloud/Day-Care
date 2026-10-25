import { jwtVerify, SignJWT } from "jose";

const JWT_ALGORITHM = "HS256";

export type SessionPayload = {
  /** Encrypted external user id (see lib/user-id.ts) — never the raw DB id. */
  sub: string;
  /** users.session_version at sign-in. Tokens issued before revocation existed have no claim and read as 0. */
  sv: number;
};

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return new TextEncoder().encode(secret);
}

/**
 * Produces a compact, signed, expiring JWT (HS256). There is no session
 * table in the schema (none was added, per instruction) — this token IS
 * the session: only the server holds JWT_SECRET, so the client can carry
 * the token without being able to forge or tamper with it undetected.
 */
export async function signSessionToken(
  payload: SessionPayload,
  expiresInSeconds: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ sv: payload.sv })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(payload.sub)
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(getJwtSecretKey());
}

/**
 * Verifies signature, expiry, and algorithm, returning the decoded
 * payload only if all check out. Never throws — any malformed, tampered,
 * expired, wrong-secret, or wrong-algorithm token simply yields `null`,
 * so callers can treat it exactly like "no session". Verification is
 * explicitly restricted to HS256 — a token whose header claims a
 * different algorithm is rejected, not silently trusted.
 */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: [JWT_ALGORITHM],
    });

    if (typeof payload.sub !== "string") {
      return null;
    }

    // Legacy tokens (no claim) are version 0 — valid only until that user's first revocation.
    const sv = payload.sv === undefined ? 0 : payload.sv;

    if (typeof sv !== "number" || !Number.isInteger(sv) || sv < 0) {
      return null;
    }

    return { sub: payload.sub, sv };
  } catch {
    return null;
  }
}
