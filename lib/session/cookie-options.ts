/**
 * Session cookie attributes. Secure is the default everywhere. The ONLY way
 * to get a non-Secure cookie is the explicit opt-out
 * `ALLOW_INSECURE_SESSION_COOKIE=true` while `NODE_ENV === "development"`
 * (e.g. testing from another device over plain-HTTP LAN) — the flag is
 * ignored in production, test and any unrecognised NODE_ENV, so a stray
 * environment variable can never downgrade a deployed site. (Modern
 * browsers accept Secure cookies on http://localhost, so the opt-out is
 * rarely needed.)
 */
export function shouldUseSecureCookie(env: { NODE_ENV?: string; ALLOW_INSECURE_SESSION_COOKIE?: string } = process.env): boolean {
  return !(env.NODE_ENV === "development" && env.ALLOW_INSECURE_SESSION_COOKIE === "true");
}

export function sessionCookieOptions(maxAgeSeconds: number, env: { NODE_ENV?: string; ALLOW_INSECURE_SESSION_COOKIE?: string } = process.env) {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookie(env),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
