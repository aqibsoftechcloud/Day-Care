export type PageStatus = "active" | "inactive";

/** `global` = city-independent (city_id null); `city` = tied to one city. */
export type PageScope = "global" | "city";

/** Where a page links from in the public footer. */
export type PageFooterPlacement = "company" | "legal" | "hidden";

/** Mirrors services/page.service.ts's toSafePage() output — embeds `language`/`city`/`location` alongside the raw FK scalars. */
export type Page = {
  id: number;
  language_id: number;
  title: string;
  seo_url: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keyword: string | null;
  category: string;
  city_id: number | null;
  scope: PageScope;
  location_id: number | null;
  body: string | null;
  status: PageStatus;
  footer_placement: PageFooterPlacement;
  created_at: string;
  updated_at: string;
  language: { id: number; name: string };
  /** `null` for a global page. */
  city: { id: number; city_name: string } | null;
  location: { id: number; area: string; zipcode: string } | null;
};

/** Mirrors validators/page.validator.ts's createPageSchema — note the singular "meta_keyword" field name (differs from other modules' "meta_keywords"). */
export type CreatePageInput = {
  language_id: number;
  title: string;
  seo_url: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keyword?: string | null;
  category: string;
  scope: PageScope;
  /** Required when scope is `city`; must be omitted/null for `global`. */
  city_id?: number | null;
  location_id?: number | null;
  body?: string | null;
  status?: PageStatus;
  footer_placement?: PageFooterPlacement;
};

export type UpdatePageInput = Partial<CreatePageInput>;

export type ListPagesFilter = {
  city_id?: number;
  scope?: PageScope;
  status?: PageStatus;
};
