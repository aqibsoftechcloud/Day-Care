import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Sliding-window rate limiting backed by the `rate_limit_events` table, so
 * limits hold across every app instance (the project has no Redis). Each
 * counted event is one row; a bucket is limited while it has `limit` or more
 * rows inside the window. Rows are only ever delayed, never locked
 * permanently — a limited key frees itself as events age out.
 */

export type RateLimitResult = { limited: boolean; retryAfterSeconds: number };

const RETENTION_MS = 24 * 60 * 60 * 1000;
const PRUNE_PROBABILITY = 0.02;

/** Namespaced bucket key; identifiers (emails, IPs, phones) are hashed so no PII is stored. */
export function rateLimitKey(namespace: string, identifier: string): string {
  return `${namespace}:${createHash("sha256").update(identifier).digest("hex").slice(0, 32)}`;
}

export async function checkRateLimit(bucket: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const since = new Date(Date.now() - windowMs);
  const count = await prisma.rate_limit_events.count({ where: { bucket, created_at: { gte: since } } });

  if (count < limit) {
    return { limited: false, retryAfterSeconds: 0 };
  }

  // The window frees up when the (count - limit + 1)-th oldest event expires.
  const blocking = await prisma.rate_limit_events.findMany({
    where: { bucket, created_at: { gte: since } },
    orderBy: { created_at: "asc" },
    skip: count - limit,
    take: 1,
    select: { created_at: true },
  });
  const freesAt = (blocking[0]?.created_at.getTime() ?? Date.now()) + windowMs;

  return { limited: true, retryAfterSeconds: Math.max(1, Math.ceil((freesAt - Date.now()) / 1000)) };
}

export async function recordRateLimitEvent(...buckets: string[]): Promise<void> {
  await prisma.rate_limit_events.createMany({ data: buckets.map((bucket) => ({ bucket })) });

  if (Math.random() < PRUNE_PROBABILITY) {
    await prisma.rate_limit_events.deleteMany({ where: { created_at: { lt: new Date(Date.now() - RETENTION_MS) } } });
  }
}

/**
 * The visitor's IP. `X-Forwarded-For` is only trustworthy when set by YOUR
 * reverse proxy, so the address is read from the right: with
 * TRUSTED_PROXY_HOPS=N the client is the Nth entry from the end (the one
 * your outermost trusted proxy appended). Default 1 (a single proxy/CDN).
 * Set 0 when the app is exposed directly — headers are then ignored and all
 * traffic shares one "direct" bucket rather than trusting a spoofable value.
 */
export function getClientIp(headers: Headers): string {
  const hops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10);
  if (!Number.isFinite(hops) || hops <= 0) return "direct";

  const forwarded = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const candidate = forwarded.length >= hops ? forwarded[forwarded.length - hops] : headers.get("x-real-ip")?.trim();

  return candidate && candidate.length <= 64 ? candidate : "unknown";
}
