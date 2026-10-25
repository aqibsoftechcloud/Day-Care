export type SpecialitySectionType =
  | "hero"
  | "overview"
  | "treatments"
  | "symptoms"
  | "doctors"
  | "hospital"
  | "faqs"
  | "cta"
  | "custom"
  | "why_choose_us";
export type SpecialitySectionStatus = "active" | "inactive";

/** Mirrors validators/speciality-section.validator.ts's `whyChooseUsIconKeySchema` — a controlled allowlist, never an arbitrary string or component name. Shared by both `why_choose_us` and `cta`'s `items` — never a second icon vocabulary. */
export type WhyChooseUsIconKey = "stethoscope" | "building" | "heart" | "message" | "shield" | "doctor" | "hospital" | "check";

export type WhyChooseUsItem = {
  icon_key: WhyChooseUsIconKey;
  title: string;
  description: string;
};

/** `items` (the "support points" bullets) reuses `WhyChooseUsItem` verbatim — an empty/missing array means the public page shows no support points at all, never a fallback to old hardcoded copy. */
export type CtaSectionContent = {
  heading?: string | null;
  description?: string | null;
  items?: WhyChooseUsItem[];
  button_text?: string | null;
  button_url?: string | null;
};

/** Section Title, rich-text Content, optional Image — the only content shape for `section_type === "custom"`. */
export type CustomSectionContent = {
  title: string;
  content: string;
  image?: string | null;
};

/** The only content shape for `section_type === "why_choose_us"`. `heading` optional — blank means "use the page's own generic template heading". `items` supports any number of cards. */
export type WhyChooseUsSectionContent = {
  heading?: string | null;
  items: WhyChooseUsItem[];
};

/** Mirrors services/speciality-section.service.ts's select output. `content` is only ever meaningful for `cta`, `custom`, and `why_choose_us` — every other type is `null`. */
export type SpecialitySection = {
  id: number;
  speciality_id: number;
  section_type: SpecialitySectionType;
  section_order: number;
  status: SpecialitySectionStatus;
  content: CtaSectionContent | CustomSectionContent | WhyChooseUsSectionContent | null;
  created_at: string;
  updated_at: string;
};

/** Always creates a `section_type: "custom"` row — a fixed type can never be created through the API. */
export type CreateSpecialitySectionInput = {
  content: CustomSectionContent;
  status?: SpecialitySectionStatus;
};

export type UpdateSpecialitySectionInput = {
  section_order?: number;
  status?: SpecialitySectionStatus;
  content?: Record<string, unknown>;
};

export type ReorderSpecialitySectionsInput = {
  order: { id: number; section_order: number }[];
};
