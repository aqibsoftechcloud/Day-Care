import { apiFetch } from "./client";
import type {
  BlogFaq,
  CreateBlogFaqInput,
  ListBlogFaqsFilter,
  UpdateBlogFaqInput,
} from "@/types/blog-faq";

type BlogFaqsListResponse = { success: true; blogFaqs: BlogFaq[] };
type BlogFaqResponse = { success: true; blogFaq: BlogFaq };
type DeleteBlogFaqResponse = { success: true; message: string };

function toQueryString(filter?: ListBlogFaqsFilter): string {
  if (!filter?.blog_id) return "";
  return `?blog_id=${filter.blog_id}`;
}

export function listBlogFaqs(filter?: ListBlogFaqsFilter) {
  return apiFetch<BlogFaqsListResponse>(`/api/blog-faqs${toQueryString(filter)}`);
}

export function getBlogFaq(id: number) {
  return apiFetch<BlogFaqResponse>(`/api/blog-faqs/${id}`);
}

export function createBlogFaq(data: CreateBlogFaqInput) {
  return apiFetch<BlogFaqResponse>("/api/blog-faqs", { method: "POST", body: data });
}

export function updateBlogFaq(id: number, data: UpdateBlogFaqInput) {
  return apiFetch<BlogFaqResponse>(`/api/blog-faqs/${id}`, { method: "PUT", body: data });
}

/** Soft delete — sets status to "inactive". */
export function deleteBlogFaq(id: number) {
  return apiFetch<DeleteBlogFaqResponse>(`/api/blog-faqs/${id}`, { method: "DELETE" });
}
