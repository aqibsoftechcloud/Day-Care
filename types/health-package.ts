export type HealthPackageStatus = "active" | "inactive";

/**
 * Mirrors services/health-package.service.ts's raw Prisma return — no
 * select clause, no relations (healthcheck_packs has none). `cost` is a
 * Prisma Decimal column, serialized to a string over JSON (same
 * convention already used for Hospital's `google_reviews`/
 * `patient_satisfaction_score` Decimal columns).
 */
export type HealthPackage = {
  id: number;
  package_title: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  seo_url: string;
  cost: string;
  pack_image: string | null;
  package_file: string | null;
  package_inclusions: string | null;
  status: HealthPackageStatus;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/health-package.validator.ts's listHealthPackagesQuerySchema. */
export type ListHealthPackagesFilter = {
  status?: HealthPackageStatus;
};

/**
 * Mirrors validators/health-package.validator.ts's createHealthPackageSchema
 * exactly. `pack_image` is handled separately as a File (multipart upload).
 * `package_file` is deliberately a plain string reference, not a file
 * upload — the validator's own comment documents this: it isn't named as
 * an image field and the project's only upload validation is image-MIME
 * only, so forcing a package_file (almost certainly a brochure/PDF)
 * through that would be wrong.
 */
export type CreateHealthPackageInput = {
  package_title: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  seo_url: string;
  cost?: number | string;
  package_file?: string | null;
  package_inclusions?: string | null;
  status?: HealthPackageStatus;
};

export type UpdateHealthPackageInput = Partial<CreateHealthPackageInput>;
