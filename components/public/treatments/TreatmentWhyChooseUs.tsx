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
import { ExpandableList } from "@/components/public/shared/ExpandableList";
import type { PublicTreatmentWhyChooseUs, PublicTreatmentWhyChooseUsIconKey } from "@/lib/public/treatments";

const INITIAL_LIMIT = 4;

/**
 * Real `treatment_sections` `why_choose_us` content, same shape and icon
 * allowlist as Speciality's — own independent file/icon map copy per
 * this codebase's established convention (see `SpecialityWhyChooseUs.tsx`'s
 * own doc comment). Renders nothing when the admin hasn't configured this
 * section (`whyChooseUs` is `null` whenever the row is empty/inactive).
 * Initially shows 4 — `ExpandableList` reveals the rest on demand (this
 * previously hard-truncated to 4 with `.slice(0, 4)` and no way to see
 * the rest — that silent drop is exactly what this change fixes).
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

export function TreatmentWhyChooseUs({
  treatmentName,
  whyChooseUs,
}: {
  treatmentName: string;
  whyChooseUs: PublicTreatmentWhyChooseUs;
}) {
  if (!whyChooseUs || whyChooseUs.items.length === 0) return null;

  return (
    <section aria-labelledby="treatment-why-us-heading" className="bg-slate-50">
      <div className="public-container py-10 sm:py-12 lg:pr-125">
        <h2 id="treatment-why-us-heading" className="text-2xl font-bold text-slate-900 sm:text-[1.75rem]">
          {whyChooseUs.heading || `Choosing Care for ${treatmentName}`}
        </h2>

        <div className="mt-6">
          <ExpandableList
            items={whyChooseUs.items.map((item, index) => {
              const Icon = resolveIcon(item.iconKey);
              return (
                <div key={`${item.title}-${index}`} className="flex flex-col gap-2.5 rounded-lg border border-slate-200 bg-white p-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--public-primary)/8 text-(--public-primary)">
                    <Icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>
                </div>
              );
            })}
            initialLimit={INITIAL_LIMIT}
            itemsClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            moreLabel="View More"
          />
        </div>
      </div>
    </section>
  );
}
