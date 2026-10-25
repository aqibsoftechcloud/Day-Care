import { apiFetch } from "./client";
import type {
  Blog,
  CreateBlogInput,
  ListBlogsFilter,
  SetBlogRelatedContentInput,
  UpdateBlogInput,
} from "@/types/blog";

type BlogsListResponse = { success: true; blogs: Blog[] };
type BlogResponse = { success: true; blog: Blog };
type DeleteBlogResponse = { success: true; message: string };

function toQueryString(filter?: ListBlogsFilter): string {
  if (!filter) return "";
  const params = new URLSearchParams();
  if (filter.blog_category_id !== undefined) params.set("blog_category_id", String(filter.blog_category_id));
  if (filter.language_id !== undefined) params.set("language_id", String(filter.language_id));
  if (filter.city_id !== undefined) params.set("city_id", String(filter.city_id));
  if (filter.scope !== undefined) params.set("scope", filter.scope);
  if (filter.blog_status !== undefined) params.set("blog_status", filter.blog_status);
  if (filter.related_global_speciality_id !== undefined)
    params.set("related_global_speciality_id", String(filter.related_global_speciality_id));
  if (filter.related_global_treatment_id !== undefined)
    params.set("related_global_treatment_id", String(filter.related_global_treatment_id));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listBlogs(filter?: ListBlogsFilter) {
  return apiFetch<BlogsListResponse>(`/api/blogs${toQueryString(filter)}`);
}

export function getBlog(id: number) {
  return apiFetch<BlogResponse>(`/api/blogs/${id}`);
}

/**
 * Builds the multipart body the actual controller expects
 * (parseMultipartFields) — `blog_image`/`author_image` are real files,
 * never JSON. For each image, `undefined` means "leave unchanged",
 * `null` means "explicit clear" (sent as the field's own empty string,
 * same convention `resolveImageInput` on the controller reads), and a
 * `File` means "replace".
 */
function toBlogFormData(
  data: CreateBlogInput | UpdateBlogInput,
  image?: File | null,
  authorImage?: File | null
): FormData {
  const formData = new FormData();
  if (data.blog_category_id !== undefined) formData.append("blog_category_id", String(data.blog_category_id));
  if (data.blog_title !== undefined) formData.append("blog_title", data.blog_title);
  if (data.meta_title) formData.append("meta_title", data.meta_title);
  if (data.meta_description) formData.append("meta_description", data.meta_description);
  if (data.meta_keywords) formData.append("meta_keywords", data.meta_keywords);
  if (data.seo_url !== undefined) formData.append("seo_url", data.seo_url);
  if (data.language_id !== undefined) formData.append("language_id", String(data.language_id));
  if (data.scope !== undefined) formData.append("scope", data.scope);
  // A global blog sends no city at all.
  if (data.city_id !== undefined) formData.append("city_id", String(data.city_id));
  if (data.published_date) formData.append("published_date", data.published_date);
  if (data.search_keywords_for_doctors) formData.append("search_keywords_for_doctors", data.search_keywords_for_doctors);
  if (data.blog_status) formData.append("blog_status", data.blog_status);
  if (data.ai_content_generator !== undefined) formData.append("ai_content_generator", String(data.ai_content_generator));
  if (data.blog_text) formData.append("blog_text", data.blog_text);
  // Unlike meta_title/search_keywords_for_doctors (only sent when truthy,
  // so clearing them in the form is a known pre-existing no-op), author_name
  // must be explicitly clearable — sent whenever the caller provided a
  // value at all (including ""), omitted only when truly undefined.
  if (data.author_name !== undefined) formData.append("author_name", data.author_name ?? "");
  if (data.is_featured !== undefined) formData.append("is_featured", String(data.is_featured));
  if (image) formData.append("blog_image", image);
  else if (image === null) formData.append("blog_image", "");
  if (authorImage) formData.append("author_image", authorImage);
  else if (authorImage === null) formData.append("author_image", "");
  return formData;
}

export function createBlog(data: CreateBlogInput, image?: File | null, authorImage?: File | null) {
  return apiFetch<BlogResponse>("/api/blogs", {
    method: "POST",
    body: toBlogFormData(data, image, authorImage),
  });
}

/** Images are optional on update — omit one to keep its existing stored value, or pass `null` to explicitly clear it. */
export function updateBlog(id: number, data: UpdateBlogInput, image?: File | null, authorImage?: File | null) {
  return apiFetch<BlogResponse>(`/api/blogs/${id}`, {
    method: "PUT",
    body: toBlogFormData(data, image, authorImage),
  });
}

/** Soft delete — sets blog_status to "inactive" server-side; the stored image and blog_faqs are intentionally preserved. */
export function deleteBlog(id: number) {
  return apiFetch<DeleteBlogResponse>(`/api/blogs/${id}`, { method: "DELETE" });
}

/** Replaces this blog's full set of Related Specialities/Treatments — a plain JSON body, no file upload involved. */
export function setBlogRelatedContent(id: number, data: SetBlogRelatedContentInput) {
  return apiFetch<BlogResponse>(`/api/blogs/${id}/related-content`, { method: "PUT", body: data });
}
