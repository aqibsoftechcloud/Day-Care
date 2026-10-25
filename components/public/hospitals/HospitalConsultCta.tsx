import Image from "next/image";
import { getContactUsUrl } from "@/lib/public/urls";
import {
  Building2,
  CheckCircle2,
  HeartHandshake,
  Hospital,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { PublicHospitalCta } from "@/lib/public/hospitals";

/** Same controlled icon allowlist as Why Choose Us — own local copy per this codebase's established convention (see `SpecialityFinalCta.tsx`). */
const ICON_MAP: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  building: Building2,
  heart: HeartHandshake,
  message: MessageCircle,
  shield: ShieldCheck,
  doctor: UsersRound,
  hospital: Hospital,
  check: CheckCircle2,
};

function resolveIcon(iconKey: string): LucideIcon {
  return ICON_MAP[iconKey] ?? Sparkles;
}

type HospitalConsultCtaProps = {
  hospitalName: string;
  cta: PublicHospitalCta;
};

/**
 * "Consult the Doctor Now" — a compact inline CTA, not a second full
 * appointment form. The button scrolls back up to the Hero's real
 * `AppointmentLeadForm` instance, same "one form, reused as the
 * conversion target" pattern as TreatmentInlineCta.tsx.
 *
 * Heading/description/button fall back to plain generic interface copy
 * (never a hospital-specific fabricated claim) when the admin hasn't
 * configured an override — same convention `SpecialityFinalCta.tsx`
 * already established. Support points (`cta.items`) have NO such
 * fallback: an empty array renders no list at all, never the old
 * hardcoded three-bullet copy this section previously always showed.
 */
export function HospitalConsultCta({ hospitalName, cta }: HospitalConsultCtaProps) {
  const heading = cta.heading || "Consult the Doctor Now";
  const description = cta.description || `Get in touch with the ${hospitalName} team to confirm your consultation.`;
  const buttonText = cta.buttonText || "Book Appointment";
  const buttonUrl = cta.buttonUrl || getContactUsUrl();

  return (
    <section aria-labelledby="hospital-consult-cta-heading" className="bg-(--color-hero-background)">
      <div className={`public-container grid grid-cols-1 items-center gap-8 py-10 sm:py-12 ${cta.image ? "lg:grid-cols-2" : ""}`}>
        <div>
          <h2 id="hospital-consult-cta-heading" className="text-2xl font-black tracking-tight text-(--color-hero-heading) sm:text-3xl">
            {heading}
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/70 sm:text-base">{description}</p>

          {cta.items.length > 0 && (
            <ul className="mt-5 flex flex-col gap-2.5">
              {cta.items.map((item, index) => {
                const Icon = resolveIcon(item.iconKey);
                return (
                  <li key={`${item.title}-${index}`} className="flex items-start gap-2.5 text-sm text-white/80 sm:text-base">
                    <Icon className="mt-0.5 size-4.5 shrink-0 text-(--color-hero-eyebrow)" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-white/70">{item.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <a
            href={buttonUrl}
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-(--color-cta-primary-bg) px-5 py-3 text-sm font-semibold text-(--color-cta-primary-text) transition-colors hover:bg-(--color-cta-primary-bg)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-hero-background)"
          >
            {buttonText}
          </a>
        </div>

        {/* Only when the admin has set a CTA image — no empty placeholder panel otherwise. */}
        {cta.image && (
          <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-(--public-radius-card) bg-white/10">
            <Image src={cta.image} alt="" fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
          </div>
        )}
      </div>
    </section>
  );
}
