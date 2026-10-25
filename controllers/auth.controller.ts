import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { loginSchema } from "@/validators/auth.validator";
import { InactiveUserError, InvalidCredentialsError, login } from "@/services/auth.service";
import {
  createSession,
  getCurrentUser,
  invalidateSession,
  toSafeSessionUser,
} from "@/lib/session/session";
import { getRolePermissionSlugs } from "@/lib/auth/authorization";
import { checkRateLimit, getClientIp, rateLimitKey, recordRateLimitEvent } from "@/lib/rate-limit";

// Failed-login limits per 15 minutes. Temporary (they age out), and the per-account
// limit is scoped to the caller's IP so a stranger cannot lock a real user out;
// the larger account-wide and IP-wide caps stop distributed / credential-stuffing attempts.
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT_ACCOUNT_PER_IP = 5;
const LOGIN_LIMIT_ACCOUNT = 20;
const LOGIN_LIMIT_IP = 20;

function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  if (
    error instanceof InvalidCredentialsError ||
    error instanceof InactiveUserError
  ) {
    // Same public message for both: an inactive account must not be distinguishable from a wrong
    // password (it is only reachable with correct credentials, but credential-stuffing would learn
    // which stolen passwords are valid). The distinct error type still reaches the rate limiter.
    return NextResponse.json(
      { success: false, message: new InvalidCredentialsError().message },
      { status: 401 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function loginHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const ip = getClientIp(request.headers);
    const email = data.email.toLowerCase();
    const buckets = {
      accountIp: rateLimitKey("login:acct-ip", `${email}|${ip}`),
      account: rateLimitKey("login:acct", email),
      ip: rateLimitKey("login:ip", ip),
    };
    const checks = await Promise.all([
      checkRateLimit(buckets.accountIp, LOGIN_LIMIT_ACCOUNT_PER_IP, LOGIN_WINDOW_MS),
      checkRateLimit(buckets.account, LOGIN_LIMIT_ACCOUNT, LOGIN_WINDOW_MS),
      checkRateLimit(buckets.ip, LOGIN_LIMIT_IP, LOGIN_WINDOW_MS),
    ]);
    const blocked = checks.find((check) => check.limited);

    if (blocked) {
      return NextResponse.json(
        { success: false, message: "Too many failed sign-in attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.max(...checks.map((c) => c.retryAfterSeconds))) } }
      );
    }

    let user;
    try {
      user = await login(data);
    } catch (error) {
      if (error instanceof InvalidCredentialsError || error instanceof InactiveUserError) {
        await recordRateLimitEvent(buckets.accountIp, buckets.account, buckets.ip);
      }
      throw error;
    }

    await createSession(user.id);

    return NextResponse.json({
      success: true,
      user: toSafeSessionUser(user),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function meHandler() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const permissions = await getRolePermissionSlugs(user.role.id);

    return NextResponse.json({ success: true, user: { ...user, permissions } });
  } catch (error) {
    return handleError(error);
  }
}

export async function logoutHandler() {
  try {
    await invalidateSession();

    return NextResponse.json({ success: true, message: "Logged out" });
  } catch (error) {
    return handleError(error);
  }
}
