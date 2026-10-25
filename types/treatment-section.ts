export type TreatmentSectionType =
  | "hero"
  | "highlights"
  | "overview"
  | "facts"
  | "symptoms"
  | "options"
  | "eligibility"
  | "why_choose_us"
  | "doctors"
  | "process"
  | "journey"
  | "hospital"
  | "preparation_recovery"
  | "faqs"
  | "cta"
  | "custom";
export type TreatmentSectionStatus = "active" | "inactive";

/** Mirrors validators/speciality-section.validator.ts's `whyChooseUsIconKeySchema` — the exact same controlled allowlist, reused (not redefined) by `why_choose_us`, `cta`'s `items`, AND Treatment's `journey` steps. */
export type WhyChooseUsIconKey = "stethoscope" | "building" | "heart" | "message" | "shield" | "doctor" | "hospital" | "check";

export type WhyChooseUsItem = {
  icon_key: WhyChooseUsIconKey;
  title: string;
  description: string;
};

export type CtaSectionContent = {
  heading?: string | null;
  description?: string | null;
  items?: WhyChooseUsItem[];
  button_text?: string | null;
  button_url?: string | null;
};

export type CustomSectionContent = {
  title: string;
  content: string;
  image?: string | null;
};

export type WhyChooseUsSectionContent = {
  heading?: string | null;
  items: WhyChooseUsItem[];
};

export type LabelValueItem = { label: string; value: string };

export type HighlightsSectionContent = { items: LabelValueItem[] };
export type FactsSectionContent = { items: LabelValueItem[] };

export type OptionItem = { title: string; description: string; points?: string[] };
export type OptionsSectionContent = { heading?: string | null; items: OptionItem[] };

export type EligibilitySectionContent = {
  heading?: string | null;
  intro?: string | null;
  indicators?: string[];
  note?: string | null;
};

export type ProcessItem = { title: string; description: string };
export type ProcessSectionContent = { heading?: string | null; items: ProcessItem[] };

export type JourneyStep = { duration: string; title: string; icon: WhyChooseUsIconKey; points: string[] };
export type JourneySectionContent = { heading?: string | null; steps: JourneyStep[] };

export type PreparationRecoveryGroup = { title: string; intro?: string | null; items: string[] };
export type PreparationRecoverySectionContent = { groups: PreparationRecoveryGroup[] };

export type TreatmentSectionContent =
  | CtaSectionContent
  | CustomSectionContent
  | WhyChooseUsSectionContent
  | HighlightsSectionContent
  | FactsSectionContent
  | OptionsSectionContent
  | EligibilitySectionContent
  | ProcessSectionContent
  | JourneySectionContent
  | PreparationRecoverySectionContent
  | null;

/** Mirrors services/treatment-section.service.ts's select output. `content` is only ever meaningful for the structured/content-bearing types — every no-content fixed type (hero/overview/symptoms/doctors/hospital/faqs) is `null`. */
export type TreatmentSection = {
  id: number;
  treatment_id: number;
  section_type: TreatmentSectionType;
  section_order: number;
  status: TreatmentSectionStatus;
  content: TreatmentSectionContent;
  created_at: string;
  updated_at: string;
};

/** Always creates a `section_type: "custom"` row — a fixed type can never be created through the API. */
export type CreateTreatmentSectionInput = {
  content: CustomSectionContent;
  status?: TreatmentSectionStatus;
};

export type UpdateTreatmentSectionInput = {
  section_order?: number;
  status?: TreatmentSectionStatus;
  content?: Record<string, unknown>;
};

export type ReorderTreatmentSectionsInput = {
  order: { id: number; section_order: number }[];
};
