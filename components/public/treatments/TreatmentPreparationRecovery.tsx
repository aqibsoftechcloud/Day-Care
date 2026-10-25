import { CheckCircle2 } from "lucide-react";
import type { PublicTreatmentPreparationRecoveryGroup } from "@/lib/public/treatments";

/**
 * Real `treatment_sections` `preparation_recovery` content — an
 * editorial 3-column block (heading, intro line, bullet list) separated
 * by thin dividers, not bordered stat cards. Renders nothing when the
 * admin hasn't configured any groups yet.
 */
export function TreatmentPreparationRecovery({ groups }: { groups: PublicTreatmentPreparationRecoveryGroup[] }) {
  if (groups.length === 0) return null;

  return (
    <section aria-labelledby="treatment-prep-recovery-heading" className="public-container py-8 sm:py-10 lg:pr-125">
      <h2 id="treatment-prep-recovery-heading" className="text-2xl font-bold text-slate-900 sm:text-[1.75rem]">
        Preparation, Recovery &amp; Aftercare
      </h2>

      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:divide-x sm:divide-slate-100">
        {groups.map((group, index) => (
          <div key={group.title} className={index === 0 ? "" : "sm:pl-6"}>
            <h3 className="text-base font-bold text-slate-900">{group.title}</h3>
            {group.intro && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{group.intro}</p>}
            <ul className="mt-3 flex flex-col gap-2">
              {group.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-(--public-accent)" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
