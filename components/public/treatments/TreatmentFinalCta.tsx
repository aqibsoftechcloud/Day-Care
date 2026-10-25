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
import type { PublicTreatmentDetail, PublicTreatmentWhyChooseUsIconKey } from "@/lib/public/treatments";
import { AppointmentLeadForm } from "@/components/public/home/AppointmentLeadForm";

type TreatmentFinalCtaProps = {
  detail: PublicTreatmentDetail;
};

/**
 * Real `treatment_sections` `cta` content — same CMS philosophy already
 * implemented for Speciality's Final CTA (heading/description/items/
 * button_text/button_url, every field optional, a blank field means "use
 * the default wording already shown on the page" — never the old
 * hardcoded demo copy). `detail.cta.items` is `[]`, not a fallback list,
 * when the admin hasn't configured any support points. Same icon
 * allowlist/map, independent file copy — mirrors
 * `SpecialityFinalCta.tsx`'s exact structure.
 */
const ICON_MAP: Record<PublicTreatmentWhyChooseUsIconKey, LucideIcon> = {
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
  return ICON_MAP[iconKey as PublicTreatmentWhyChooseUsIconKey] ?? Sparkles;
}

export function TreatmentFinalCta({ detail }: TreatmentFinalCtaProps) {
  const heading = detail.cta.heading || `Need help with ${detail.name}?`;
  const description =
    detail.cta.description || `Share your details and our ${detail.cityName} team will call you back to confirm your appointment.`;

  return (
    <section aria-labelledby="treatment-final-cta-heading" className="bg-(--color-hero-background)">
      <div className="public-container grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <h2 id="treatment-final-cta-heading" className="text-3xl font-black tracking-tight text-(--color-hero-heading) sm:text-4xl">
            {heading}
          </h2>
          <p className="mt-4 max-w-lg text-base text-white/70 sm:text-lg">{description}</p>

          {detail.cta.items.length > 0 && (
            <ul className="mt-6 flex flex-col gap-4">
              {detail.cta.items.map((item, index) => {
                const Icon = resolveIcon(item.iconKey);
                return (
                  <li key={`${item.title}-${index}`} className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 size-4.5 shrink-0 text-(--color-hero-eyebrow)" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-white sm:text-base">{item.title}</p>
                      <p className="text-sm text-white/70">{item.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div
  id="speciality-final-appointment-form"
  className="w-full max-w-md scroll-mt-24 lg:justify-self-end"
>
          <AppointmentLeadForm defaultCityId={detail.cityId} defaultTreatment={`city:${detail.id}`} />
        </div>
      </div>
    </section>
  );
}
