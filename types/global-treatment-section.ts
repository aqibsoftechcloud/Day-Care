export type GlobalTreatmentSectionStatus = "active" | "inactive";

/** Flat structure (no `section_type`/`content Json?`) — a global treatment has only one kind of section, an ordered titled rich-text block. See the Prisma model's own doc comment. */
export type GlobalTreatmentSection = {
  id: number;
  global_treatment_id: number;
  title: string;
  content: string | null;
  image: string | null;
  section_order: number;
  status: GlobalTreatmentSectionStatus;
  created_at: string;
  updated_at: string;
};

export type CreateGlobalTreatmentSectionInput = {
  title: string;
  content?: string | null;
  image?: string | null;
  status?: GlobalTreatmentSectionStatus;
};

export type UpdateGlobalTreatmentSectionInput = {
  title?: string;
  content?: string | null;
  image?: string | null;
  section_order?: number;
  status?: GlobalTreatmentSectionStatus;
};

export type ReorderGlobalTreatmentSectionsInput = {
  order: { id: number; section_order: number }[];
};
