export type PageSectionType = "hero" | "about" | "features" | "content" | "cta" | "hospital_listing";
export type PageSectionStatus = "active" | "inactive";

export type HeroSectionContent = {
  title: string;
  subtitle?: string | null;
  image?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
};

export type AboutSectionContent = {
  heading: string;
  content: string;
  image?: string | null;
};

export type FeatureItem = {
  title: string;
  description?: string;
  image?: string | null;
};

export type FeaturesSectionContent = {
  heading: string;
  items: FeatureItem[];
};

export type ContentSectionContent = {
  heading: string;
  content: string;
};

export type CtaSectionContent = {
  heading: string;
  description?: string | null;
  button_text: string;
  button_url: string;
};

/** A live listing of every active hospital across all cities — the cards come from Hospital Management, never from this content. */
export type HospitalListingSectionContent = {
  heading: string;
  description?: string | null;
  /** Cards per row on large screens (fewer on tablet/mobile). */
  columns: 2 | 3 | 4;
  /** How many cards show before "Load more" (all of them when load_more is off and there are fewer). */
  initial_count: number;
  /** Reveal the remaining hospitals in steps instead of showing only `initial_count`. */
  load_more: boolean;
};

export type PageSectionContentFor<T extends PageSectionType> = T extends "hero"
  ? HeroSectionContent
  : T extends "about"
    ? AboutSectionContent
    : T extends "features"
      ? FeaturesSectionContent
      : T extends "content"
        ? ContentSectionContent
        : T extends "hospital_listing"
          ? HospitalListingSectionContent
          : CtaSectionContent;

/** Mirrors services/page-section.service.ts's select output. `content`'s shape depends on `section_type` — narrow with `PageSectionContentFor<typeof section.section_type>` at the call site. */
export type PageSection = {
  id: number;
  page_id: number;
  section_type: PageSectionType;
  section_order: number;
  status: PageSectionStatus;
  content: unknown;
  created_at: string;
  updated_at: string;
};

export type CreatePageSectionInput =
  | { section_type: "hero"; content: HeroSectionContent; section_order?: number; status?: PageSectionStatus }
  | { section_type: "about"; content: AboutSectionContent; section_order?: number; status?: PageSectionStatus }
  | { section_type: "features"; content: FeaturesSectionContent; section_order?: number; status?: PageSectionStatus }
  | { section_type: "content"; content: ContentSectionContent; section_order?: number; status?: PageSectionStatus }
  | { section_type: "cta"; content: CtaSectionContent; section_order?: number; status?: PageSectionStatus }
  | { section_type: "hospital_listing"; content: HospitalListingSectionContent; section_order?: number; status?: PageSectionStatus };

export type UpdatePageSectionInput = {
  section_order?: number;
  status?: PageSectionStatus;
  content?: Record<string, unknown>;
};

export type ReorderPageSectionsInput = {
  order: { id: number; section_order: number }[];
};
