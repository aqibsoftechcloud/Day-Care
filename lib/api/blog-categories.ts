import { apiFetch } from "./client";
import type {
  BlogCategory,
  CreateBlogCategoryInput,
  ListBlogCategoriesFilter,
  UpdateBlogCategoryInput,
} from "@/types/blog-category";

type BlogCategoriesListResponse = { success: true; blogCategories: BlogCategory[] };
type BlogCategoryResponse = { success: true; blogCategory: BlogCategory };
type DeleteBlogCategoryResponse = { success: true; message: string };

function toQueryString(filter?: ListBlogCategoriesFilter): string {
  if (!filter?.status) return "";
  return `?status=${filter.status}`;
}

/** Also used by Blogs Management to populate its "Category" select. */
export function listBlogCategories(filter?: ListBlogCategoriesFilter) {
  return apiFetch<BlogCategoriesListResponse>(`/api/blog-categories${toQueryString(filter)}`);
}

export function getBlogCategory(id: number) {
  return apiFetch<BlogCategoryResponse>(`/api/blog-categories/${id}`);
}

export function createBlogCategory(data: CreateBlogCategoryInput) {
  return apiFetch<BlogCategoryResponse>("/api/blog-categories", { method: "POST", body: data });
}

export function updateBlogCategory(id: number, data: UpdateBlogCategoryInput) {
  return apiFetch<BlogCategoryResponse>(`/api/blog-categories/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive". Refused (409) server-side if the category still has active blogs. */
export function deleteBlogCategory(id: number) {
  return apiFetch<DeleteBlogCategoryResponse>(`/api/blog-categories/${id}`, { method: "DELETE" });
}
