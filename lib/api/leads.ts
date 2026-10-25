import { apiFetch } from "./client";
import type {
  AppointmentLead,
  BookaformData,
  BookaformDataStatus,
  CreateAppointmentLeadInput,
  FeedbackLead,
  InternationalPatientLead,
  UpdateAppointmentLeadInput,
  UpdateBookaformDataInput,
  UpdateFeedbackLeadInput,
  UpdateInternationalPatientLeadInput,
} from "@/types/lead";

/**
 * These four lead/submission modules are otherwise read-only in the CMS —
 * none of the underlying list endpoints support pagination or sorting
 * query params server-side (confirmed by reading the
 * services/controllers/validators) — each supports exactly ONE
 * exact-match filter param, passed through verbatim below. Everything
 * else (other columns, free-text search) has no backend support and is
 * deliberately not offered in the UI. Update and (soft) Delete now exist
 * for all four — Book-a-Form Data reuses its existing `status` column;
 * the other three had no such column, so a nullable `deleted_at` was
 * added specifically for this (see prisma/schema.prisma) and the list
 * endpoints exclude anything with it set.
 *
 * Lead CAPTURE is not here: the public consultation form submits through its
 * Server Action / `POST /api/appointment-leads`, both backed by
 * services/consultation-lead.service.ts.
 */

type AppointmentLeadsListResponse = { success: true; appointmentLeads: AppointmentLead[] };
type AppointmentLeadResponse = { success: true; appointmentLead: AppointmentLead };
type DeleteAppointmentLeadResponse = { success: true; message: string };

/** Mirrors validators/appointment-lead.validator.ts's listAppointmentLeadsQuerySchema — `email` only, exact match. */
export function listAppointmentLeads(filter?: { email?: string }) {
  return apiFetch<AppointmentLeadsListResponse>("/api/appointment-leads", {
    query: { email: filter?.email },
  });
}

export function getAppointmentLead(id: number) {
  return apiFetch<AppointmentLeadResponse>(`/api/appointment-leads/${id}`);
}

export function updateAppointmentLead(id: number, data: UpdateAppointmentLeadInput) {
  return apiFetch<AppointmentLeadResponse>(`/api/appointment-leads/${id}`, {
    method: "PUT",
    body: data,
  });
}

/** Soft delete — sets deleted_at server-side, never removes the row. */
export function deleteAppointmentLead(id: number) {
  return apiFetch<DeleteAppointmentLeadResponse>(`/api/appointment-leads/${id}`, {
    method: "DELETE",
  });
}

type FeedbackLeadsListResponse = { success: true; feedbackLeads: FeedbackLead[] };
type FeedbackLeadResponse = { success: true; feedbackLead: FeedbackLead };
type DeleteFeedbackLeadResponse = { success: true; message: string };

/** Mirrors validators/feedback-lead.validator.ts's listFeedbackLeadsQuerySchema — `email` only, exact match. */
export function listFeedbackLeads(filter?: { email?: string }) {
  return apiFetch<FeedbackLeadsListResponse>("/api/feedback-leads", {
    query: { email: filter?.email },
  });
}

export function getFeedbackLead(id: number) {
  return apiFetch<FeedbackLeadResponse>(`/api/feedback-leads/${id}`);
}

export function updateFeedbackLead(id: number, data: UpdateFeedbackLeadInput) {
  return apiFetch<FeedbackLeadResponse>(`/api/feedback-leads/${id}`, {
    method: "PUT",
    body: data,
  });
}

/** Soft delete — sets deleted_at server-side, never removes the row. */
export function deleteFeedbackLead(id: number) {
  return apiFetch<DeleteFeedbackLeadResponse>(`/api/feedback-leads/${id}`, {
    method: "DELETE",
  });
}

type InternationalPatientLeadsListResponse = {
  success: true;
  internationalPatientLeads: InternationalPatientLead[];
};
type InternationalPatientLeadResponse = {
  success: true;
  internationalPatientLead: InternationalPatientLead;
};
type DeleteInternationalPatientLeadResponse = { success: true; message: string };

/** Mirrors validators/international-patient-lead.validator.ts's listInternationalPatientLeadsQuerySchema — `country` only, exact match. */
export function listInternationalPatientLeads(filter?: { country?: string }) {
  return apiFetch<InternationalPatientLeadsListResponse>("/api/international-patient-leads", {
    query: { country: filter?.country },
  });
}

export function getInternationalPatientLead(id: number) {
  return apiFetch<InternationalPatientLeadResponse>(`/api/international-patient-leads/${id}`);
}

export function updateInternationalPatientLead(
  id: number,
  data: UpdateInternationalPatientLeadInput
) {
  return apiFetch<InternationalPatientLeadResponse>(`/api/international-patient-leads/${id}`, {
    method: "PUT",
    body: data,
  });
}

/** Soft delete — sets deleted_at server-side, never removes the row. */
export function deleteInternationalPatientLead(id: number) {
  return apiFetch<DeleteInternationalPatientLeadResponse>(`/api/international-patient-leads/${id}`, {
    method: "DELETE",
  });
}

type BookaformDataListResponse = { success: true; bookaformDataList: BookaformData[] };
type BookaformDataResponse = { success: true; bookaformData: BookaformData };
type DeleteBookaformDataResponse = { success: true; message: string };

/**
 * Route path is genuinely "/api/bookaform-data" (no hyphen in
 * "bookaform") — matches app/api/bookaform-data/route.ts exactly, even
 * though the module slug/nav href use "book-a-form". Mirrors
 * validators/bookaform.validator.ts's listBookaformDataQuerySchema —
 * `status` only, one of "active"/"inactive".
 */
export function listBookaformData(filter?: { status?: BookaformDataStatus }) {
  return apiFetch<BookaformDataListResponse>("/api/bookaform-data", {
    query: { status: filter?.status },
  });
}

export function getBookaformData(id: number) {
  return apiFetch<BookaformDataResponse>(`/api/bookaform-data/${id}`);
}

export function updateBookaformData(id: number, data: UpdateBookaformDataInput) {
  return apiFetch<BookaformDataResponse>(`/api/bookaform-data/${id}`, {
    method: "PUT",
    body: data,
  });
}

/** Soft delete — sets status to "inactive" server-side, never removes the row. */
export function deleteBookaformData(id: number) {
  return apiFetch<DeleteBookaformDataResponse>(`/api/bookaform-data/${id}`, {
    method: "DELETE",
  });
}
