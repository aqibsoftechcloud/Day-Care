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
import { SectionHeader } from "@/components/public/shared/SectionHeader";
import type { PublicHospitalWhyChooseUs } from "@/lib/public/hospitals";

type HospitalWhyChooseUsProps = {
  hospitalName: string;
  whyChooseUs: PublicHospitalWhyChooseUs;
};

/** Same controlled icon allowlist as Speciality/Treatment's Why Choose Us — see `validators/speciality-section.validator.ts`'s `whyChooseUsIconKeySchema`. `Sparkles` is the safe fallback for any key this map doesn't recognize (the validator already rejects an unknown key at write time). */
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

/**
 * "Why Choose [Hospital Name]?" — real CMS content only
 * (`hospital_sections`, `section_type: "why_choose_us"`), same visual
 * pattern as `SpecialityWhyChooseUs.tsx`. Renders nothing when the
 * section has no content yet or is disabled — never a fallback to old
 * hardcoded copy.
 */
export function HospitalWhyChooseUs({ hospitalName, whyChooseUs }: HospitalWhyChooseUsProps) {
  if (!whyChooseUs || whyChooseUs.items.length === 0) return null;

  const { heading, items } = whyChooseUs;

  return (
    <section
      id="hospital-why-us-heading"
      aria-labelledby="hospital-why-us-title"
      className="bg-slate-50"
    >
      <div className="public-container py-10 sm:py-12">
        <SectionHeader
          eyebrow="Why Day Care Surgeries"
          title={heading || `Why Choose ${hospitalName}?`}
          headingId="hospital-why-us-title"
          align="center"
        />

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const Icon = resolveIcon(item.iconKey);
            return (
              <div key={`${item.title}-${index}`} className="flex flex-col gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white p-6">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--public-primary)/8 text-(--public-primary)">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
