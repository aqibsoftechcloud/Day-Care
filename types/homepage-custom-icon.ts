/** Mirrors services/homepage-custom-icon.service.ts's select output. */
export type HomepageCustomIcon = {
  id: number;
  file_name: string;
  path: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  file_size: number;
  created_at: string;
  updated_at: string;
};
