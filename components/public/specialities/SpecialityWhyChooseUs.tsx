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
import type { PublicSpecialityDetail, PublicSpecialityWhyChooseUsIconKey } from "@/lib/public/specialities";

type SpecialityWhyChooseUsProps = {
  detail: PublicSpecialityDetail;
};

/**
 * Maps the controlled `icon_key` allowlist (validators/speciality-section.validator.ts's
 * `whyChooseUsIconKeySchema`) to one specific Lucide icon each — CMS
 * content can only ever select a key from that allowlist, never an
 * arbitrary icon name or component. `Sparkles` is the safe fallback for
 * any key this map doesn't recognize (legacy/edge-case data only, since
 * the validator itself already rejects an unknown key at write time) —
 * this must never throw or leave a card iconless.
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
 * CMS-controlled per speciality via `speciality_sections` (`section_type
 * === "why_choose_us"`) — no hardcoded business/editorial copy here
 * anymore (the old static 4-card `REASONS` array is gone). `detail.whyChooseUs`
 * is `null` whenever this speciality has no content yet (a brand-new
 * section row starts empty) or the section is disabled — in either case
 * this renders nothing at all, never a fallback to old marketing copy.
 * Works identically for any speciality/any number of items; the layout
 * visually reads best around 4 cards but nothing here caps it at 4.
 */
export function SpecialityWhyChooseUs({ detail }: SpecialityWhyChooseUsProps) {
  if (!detail.whyChooseUs || detail.whyChooseUs.items.length === 0) {
    return null;
  }

  const { heading, items } = detail.whyChooseUs;

  return (
    <section aria-labelledby="speciality-why-us-heading" className="bg-slate-50">
      <div className="public-container py-16 sm:py-20">
        <SectionHeader
          eyebrow="Why Day Care Surgeries"
          title={heading || `Choosing care for ${detail.name}`}
          headingId="speciality-why-us-heading"
          align="center"
        />

        <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const Icon = resolveIcon(item.iconKey);
            return (
              <div
                key={`${item.title}-${index}`}
                className="flex flex-col gap-3 rounded-(--public-radius-card) border border-slate-200 bg-white p-6"
              >
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
