import type { PublicTreatmentDetail } from "@/lib/public/treatments";
import { SafeHtml } from "@/components/public/shared/SafeHtml";

type TreatmentOverviewProps = {
  detail: PublicTreatmentDetail;
};

/**
 * Real `treatments.description`, rendered as actual rich HTML (headings,
 * lists, links — not stripped to plain paragraphs) via the same
 * `.rte-content` + no-server-sanitizer convention every other
 * admin-authored HTML on this site already uses (see
 * `CustomContentSection.tsx`) — this is the Treatment-only Overview
 * upgrade called for in Phase 2 ("must support rich text... do not
 * display raw HTML"); Speciality's own Overview is untouched. Section
 * uses the same wide `public-container` as every other section on the
 * page; the prose itself is capped at a comfortable ~900px reading width
 * and left-aligned within it, not re-centered.
 */
export function TreatmentOverview({ detail }: TreatmentOverviewProps) {
  if (!detail.descriptionHtml) return null;

  return (
    <section aria-labelledby="treatment-overview-heading" className="public-container py-8 sm:py-10 lg:pr-125">
      <h2 id="treatment-overview-heading" className="max-w-225 text-2xl font-bold text-slate-900 sm:text-[1.75rem]">
        About {detail.name}
      </h2>

      <SafeHtml className="rte-content mt-4 max-w-225" html={detail.descriptionHtml} />
    </section>
  );
}
