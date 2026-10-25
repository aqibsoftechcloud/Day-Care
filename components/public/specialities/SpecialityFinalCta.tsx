import Link from "next/link";
import {
  ArrowRight,
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
import type { PublicSpecialityDetail, PublicSpecialityWhyChooseUsIconKey } from "@/lib/public/specialities";
import { AppointmentLeadForm } from "@/components/public/home/AppointmentLeadForm";
import { getContactUsUrl } from "@/lib/public/urls";

type SpecialityFinalCtaProps = {
  detail: PublicSpecialityDetail;
};

const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

/**
 * Same controlled icon allowlist/mapping as SpecialityWhyChooseUs.tsx —
 * kept as its own local copy here (not imported from that file) rather
 * than factored into a shared module, so the two sections stay fully
 * independent to touch/verify separately; the underlying `icon_key`
 * values themselves are the single shared source of truth (the same
 * `whyChooseUsIconKeySchema` allowlist in validators/speciality-section.validator.ts
 * backs both). `Sparkles` is the safe fallback for any key this map
 * doesn't recognize (legacy/edge-case data only, since the validator
 * itself already rejects an unknown key at write time).
 */
const ICON_MAP: Record<PublicSpecialityWhyChooseUsIconKey, LucideIcon> = {
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
  return ICON_MAP[iconKey as PublicSpecialityWhyChooseUsIconKey] ?? Sparkles;
}

/**
 * Two-column closing section: heading/description/support-points/button
 * on the left, the real embedded `AppointmentLeadForm` on the right — a
 * second, later conversion point using the exact same reusable component
 * as the Hero (not a second form implementation; see
 * AppointmentLeadForm's own doc comment on why it generates unique field
 * ids per instance).
 *
 * Every text field falls back to the exact copy this section always
 * rendered before it became admin-configurable (see "Manage Final CTA"
 * in the Speciality admin's Basic Information tab) — a blank
 * `detail.cta.*` field means "no override was ever saved," not "no
 * content." Support points (`detail.cta.items`) have no such fallback —
 * an empty array simply renders no list at all, never the old hardcoded
 * three-bullet copy this section used to always show. The optional
 * left-side button only appears when an admin has actually configured
 * `buttonText`/`buttonUrl` — with the form embedded directly beside it,
 * an unconfigured default has nothing useful to link to that isn't
 * already right there, so no redundant button is invented. No
 * unsupported claims (success rates, "best doctors", NABH, etc.) — just
 * plain, honest copy.
 */
export function SpecialityFinalCta({ detail }: SpecialityFinalCtaProps) {
  const heading = detail.cta.heading || `Need help with ${detail.name}?`;
  const description =
    detail.cta.description || `Share your details and our ${detail.cityName} team will call you back to confirm your appointment.`;
  const hasCustomButton = Boolean(detail.cta.buttonText || detail.cta.buttonUrl);
  const buttonText = detail.cta.buttonText || "Book an Appointment";
  const buttonUrl = detail.cta.buttonUrl || getContactUsUrl({ cityId: detail.cityId });
  const external = isExternalUrl(buttonUrl);

  return (
    <section aria-labelledby="speciality-final-cta-heading" className="bg-(--color-hero-background)">
      <div className="public-container grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <h2 id="speciality-final-cta-heading" className="text-3xl font-black tracking-tight text-(--color-hero-heading) sm:text-4xl">
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

          {hasCustomButton &&
            (external ? (
              <a
                href={buttonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-7 inline-flex items-center gap-2 rounded-lg bg-(--color-cta-primary-bg) px-5 py-3 text-sm font-semibold text-(--color-cta-primary-text) transition-colors hover:bg-(--color-cta-primary-bg)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-hero-background)"
              >
                {buttonText}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </a>
            ) : (
              <Link
                href={buttonUrl}
                className="group mt-7 inline-flex items-center gap-2 rounded-lg bg-(--color-cta-primary-bg) px-5 py-3 text-sm font-semibold text-(--color-cta-primary-text) transition-colors hover:bg-(--color-cta-primary-bg)/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-hero-background)"
              >
                {buttonText}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
        </div>

        <div
  id="speciality-final-appointment-form"
  className="w-full max-w-md scroll-mt-24 lg:justify-self-end"
>
          <AppointmentLeadForm />
        </div>
      </div>
    </section>
  );
}
