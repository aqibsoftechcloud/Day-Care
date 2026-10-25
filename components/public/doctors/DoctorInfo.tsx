import { SectionHeader } from "@/components/public/shared/SectionHeader";
import { SafeHtml } from "@/components/public/shared/SafeHtml";

type DoctorInfoProps = {
  /** Pre-formatted display name (e.g. "Dr. Arjun Reddy") — see `DoctorAbout`'s identical prop for why this is computed once by the shared server-rendered caller. */
  name: string;
  /** `doctors.doc_info`, already run through `toEditorContent()` by the resolver — real admin-authored rich text, sanitized the same way every other Tiptap-authored field on this site is (at write time, via the admin `RichTextEditor`'s own `sanitizeEditorHtml`), never a second sanitization step invented here. */
  infoHtml: string;
};

/**
 * "Doctor Info" — `doctors.doc_info`, a SEPARATE field from the plain-text
 * `doctor_description` already shown in `DoctorAbout`. This is the
 * longer rich-text content block; `DoctorAbout` is untouched and still
 * renders `about` exactly as before. Same `.rte-content` +
 * `dangerouslySetInnerHTML` convention `GlobalContent.tsx` already
 * establishes for every other admin-authored Tiptap field — not a new
 * rendering approach. Renders nothing when there's no real content.
 */
export function DoctorInfo({ name, infoHtml }: DoctorInfoProps) {
  if (!infoHtml.trim()) return null;

  return (
    <section
      id="doctor-info-heading"
      aria-labelledby="doctor-info-title"
      className="public-container scroll-mt-20 py-6 sm:py-8"
    >
      <SectionHeader compact eyebrow="More Information" title={`More About ${name}`} headingId="doctor-info-title" />
      <SafeHtml className="rte-content mt-6 max-w-3xl" html={infoHtml} />
    </section>
  );
}
