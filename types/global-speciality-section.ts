export type GlobalSpecialitySectionStatus = "active" | "inactive";

export type GlobalSpecialitySection = {
  id: number;
  global_speciality_id: number;
  title: string;
  content: string | null;
  image: string | null;
  section_order: number;
  status: GlobalSpecialitySectionStatus;
  created_at: string;
  updated_at: string;
};

export type CreateGlobalSpecialitySectionInput = {
  title: string;
  content?: string | null;
  image?: string | null;
  status?: GlobalSpecialitySectionStatus;
};

export type UpdateGlobalSpecialitySectionInput = {
  title?: string;
  content?: string | null;
  image?: string | null;
  section_order?: number;
  status?: GlobalSpecialitySectionStatus;
};

export type ReorderGlobalSpecialitySectionsInput = {
  order: { id: number; section_order: number }[];
};
