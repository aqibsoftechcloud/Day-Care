import { notFound, permanentRedirect } from "next/navigation";
import { resolveLegacyNestedGlobalTreatmentUrl } from "@/lib/public/global-content";

type LegacyNestedGlobalTreatmentPageProps = {
  // `seoUrl` carries the SPECIALITY's slug here (Next requires one param name per position across sibling routes).
  params: Promise<{ seoUrl: string; treatmentSeoUrl: string }>;
};

/**
 * LEGACY `/dcg/{specialitySeoUrl}/{treatmentSeoUrl}` — the old nested
 * global-treatment URL. A valid pair (the treatment really is linked to
 * that speciality) permanently redirects (308) to
 * `/dcg/treatment/{treatmentSeoUrl}`; any other combination is a 404, as it
 * always was. (`/dcg/speciality/{slug}` and `/dcg/treatment/{slug}` are
 * static-prefix routes and win over this one, so there is no loop.)
 */
export default async function LegacyNestedGlobalTreatmentRoute({ params }: LegacyNestedGlobalTreatmentPageProps) {
  const { seoUrl, treatmentSeoUrl } = await params;
  const result = await resolveLegacyNestedGlobalTreatmentUrl(seoUrl, treatmentSeoUrl);

  if (result.status === "redirect") {
    permanentRedirect(result.href);
  }

  notFound();
}
