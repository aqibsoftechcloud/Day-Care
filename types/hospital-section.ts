export type HospitalSectionType = "hero" | "overview" | "why_choose_us" | "cta" | "disclaimer" | "custom";
export type HospitalSectionStatus = "active" | "inactive";

/** Mirrors validators/speciality-section.validator.ts's `whyChooseUsIconKeySchema` — the exact same controlled allowlist, reused (not redefined) here. */
export type WhyChooseUsIconKey = "stethoscope" | "building" | "heart" | "message" | "shield" | "doctor" | "hospital" | "check";

export type WhyChooseUsItem = {
  icon_key: WhyChooseUsIconKey;
  title: string;
  description: string;
};

export type WhyChooseUsSectionContent = {
  heading?: string | null;
  items: WhyChooseUsItem[];
};

export type CtaSectionContent = {
  heading?: string | null;
  description?: string | null;
  items?: WhyChooseUsItem[];
  button_text?: string | null;
  button_url?: string | null;
  /** Hospital-only: the Final CTA's right-side visual. Local `/uploads/...` path set by `uploadHospitalSectionImage` — never a free-text external URL. `null`/absent falls back to the generic placeholder on the public page. */
  image?: string | null;
};

export type CustomSectionContent = {
  title: string;
  content: string;
  image?: string | null;
};

export type HospitalSectionContent = WhyChooseUsSectionContent | CtaSectionContent | CustomSectionContent | null;

/** Mirrors services/hospital-section.service.ts's select output. `content` is only ever meaningful for `why_choose_us`/`cta`/`custom` — the no-content fixed types (hero/overview/disclaimer) are always `null`. */
export type HospitalSection = {
  id: number;
  hospital_id: number;
  section_type: HospitalSectionType;
  section_order: number;
  status: HospitalSectionStatus;
  content: HospitalSectionContent;
  created_at: string;
  updated_at: string;
};

/** Always creates a `section_type: "custom"` row — a fixed type can never be created through the API. */
export type CreateHospitalSectionInput = {
  content: CustomSectionContent;
  status?: HospitalSectionStatus;
};

export type UpdateHospitalSectionInput = {
  section_order?: number;
  status?: HospitalSectionStatus;
  content?: Record<string, unknown>;
};

export type ReorderHospitalSectionsInput = {
  order: { id: number; section_order: number }[];
};
