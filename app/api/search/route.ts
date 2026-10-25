import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { MAX_SEARCH_LENGTH, searchPublicContent } from "@/lib/public/search";

/**
 * `GET /api/search?q=&city=&limit=` — public site search (no auth: it only
 * ever returns published, public fields). `city` is an optional city
 * `seo_url`; omit it for "All Cities". An empty or too-short query is not
 * an error, it just returns empty groups. See lib/public/search.ts.
 */
const searchQuerySchema = z.object({
  q: z.string().max(500).default(""),
  city: z.string().trim().max(150).optional(),
  limit: z.coerce.number().int().min(1).max(25).default(5),
});

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const parsed = searchQuerySchema.safeParse({
    q: params.get("q") ?? undefined,
    city: params.get("city") || undefined,
    limit: params.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Invalid search parameters" }, { status: 400 });
  }

  try {
    const result = await searchPublicContent({ query: parsed.data.q.slice(0, MAX_SEARCH_LENGTH * 2), citySeoUrl: parsed.data.city ?? null, limit: parsed.data.limit });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[search] failed:", error);
    return NextResponse.json({ success: false, message: "Search is temporarily unavailable" }, { status: 500 });
  }
}
