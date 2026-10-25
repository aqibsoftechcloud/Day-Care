import { notFound, permanentRedirect } from "next/navigation";
import { resolveLegacyGlobalUrl } from "@/lib/public/global-content";

type LegacyGlobalContentPageProps = {
  params: Promise<{ seoUrl: string }>;
};

/**
 * LEGACY `/dcg/{seoUrl}` — the old shared global URL. It renders nothing: a
 * speciality slug redirects (308) to `/dcg/speciality/{seoUrl}`, a treatment
 * slug to `/dcg/treatment/{seoUrl}`, anything else is a 404. (The
 * `/dcg/speciality` and `/dcg/treatment` segments themselves are static
 * routes and take precedence over this dynamic one, so a new URL can never
 * land here and loop.) Kept as a route, not a next.config redirect, because
 * deciding the destination needs a database lookup.
 */
export default async function LegacyGlobalContentRoute({ params }: LegacyGlobalContentPageProps) {
  const { seoUrl } = await params;
  const result = await resolveLegacyGlobalUrl(seoUrl);

  if (result.status === "redirect") {
    permanentRedirect(result.href);
  }

  notFound();
}
