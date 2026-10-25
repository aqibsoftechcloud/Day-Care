import { prisma } from "@/lib/prisma";
import { validateConsultationSubmission, type RawConsultationValues } from "@/lib/consultation-form/validate";
import { getConsultationFormSettings } from "@/services/consultation-form-settings.service";
import type { ConsultationFormOptions } from "@/types/consultation-form-settings";
import { checkRateLimit, rateLimitKey, recordRateLimitEvent } from "@/lib/rate-limit";

import { LEAD_HONEYPOT_FIELD } from "@/lib/consultation-form/honeypot";

/** Hard bounds on the raw payload, applied before any database work. */
export const MAX_LEAD_BODY_BYTES = 16 * 1024;
const MAX_LEAD_KEYS = 40;
const MAX_LEAD_KEY_LENGTH = 64;
const MAX_LEAD_VALUE_LENGTH = 2000;

// Per client IP (every attempt counts, so validation retries are included) and per phone number (stored leads).
const IP_LIMIT = 8;
const IP_WINDOW_MS = 10 * 60 * 1000;
const IP_DAILY_LIMIT = 40;
const IP_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;
const PHONE_LIMIT = 3;
const PHONE_WINDOW_MS = 60 * 60 * 1000;

const RATE_LIMIT_MESSAGE = "Too many requests. Please wait a few minutes and try again.";

/**
 * The ONE canonical path for a public consultation / call-back request.
 * Both the page form's Server Action
 * (components/public/home/appointment-lead-actions.ts) and the public
 * `POST /api/appointment-leads` endpoint call `submitConsultationLead`, so
 * the two can never validate or store a lead differently.
 */

/** A repeat of the same request inside this window is treated as the same lead (double click, retry after a slow response). */
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

/**
 * Trusted option lists, always read fresh from the database: active cities,
 * active global treatments, and active city treatments that belong to an
 * active city. Used both to render the public dropdowns and to validate
 * what comes back — a submitted id is only valid if it is in these lists.
 */
export async function getConsultationFormOptions(): Promise<ConsultationFormOptions> {
  const [cities, globalTreatments, cityTreatments] = await Promise.all([
    prisma.cities.findMany({
      where: { status: "active" },
      select: { id: true, city_name: true },
      orderBy: { city_name: "asc" },
    }),
    prisma.global_treatments.findMany({
      where: { status: "active" },
      select: { id: true, treatment_name: true, treatment_title: true },
      orderBy: { treatment_name: "asc" },
    }),
    prisma.treatments.findMany({
      where: { status: "active", cities: { status: "active" } },
      select: { id: true, city_id: true, sub_speciality_name: true, sub_speciality_title: true },
      orderBy: { sub_speciality_name: "asc" },
    }),
  ]);

  return {
    cities: cities.map((c) => ({ id: c.id, name: c.city_name })),
    globalTreatments: globalTreatments.map((t) => ({ id: t.id, name: t.treatment_title?.trim() || t.treatment_name })),
    cityTreatments: cityTreatments.map((t) => ({
      id: t.id,
      cityId: t.city_id,
      name: t.sub_speciality_title?.trim() || t.sub_speciality_name,
    })),
  };
}

export type SubmitConsultationLeadResult =
  | { ok: true; duplicate: boolean }
  | { ok: false; errors: Record<string, string>; message: string; rateLimitedForSeconds?: number };

/** Plain-object shape check: bounded key count/length and primitive, bounded values. */
function isAcceptableLeadPayload(raw: unknown): raw is RawConsultationValues {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return false;
  const entries = Object.entries(raw);
  if (entries.length > MAX_LEAD_KEYS) return false;

  return entries.every(([key, value]) => {
    if (key.length > MAX_LEAD_KEY_LENGTH) return false;
    if (typeof value === "string") return value.length <= MAX_LEAD_VALUE_LENGTH;
    return typeof value === "number" || typeof value === "boolean" || value === null || value === undefined;
  });
}

export async function submitConsultationLead(
  raw: RawConsultationValues,
  context: { clientIp: string }
): Promise<SubmitConsultationLeadResult> {
  if (!isAcceptableLeadPayload(raw)) {
    return { ok: false, errors: {}, message: "We couldn't read your request. Please try again." };
  }

  const ipBucket = rateLimitKey("lead:ip", context.clientIp);
  const [short, daily] = await Promise.all([
    checkRateLimit(ipBucket, IP_LIMIT, IP_WINDOW_MS),
    checkRateLimit(ipBucket, IP_DAILY_LIMIT, IP_DAILY_WINDOW_MS),
  ]);

  if (short.limited || daily.limited) {
    return { ok: false, errors: {}, message: RATE_LIMIT_MESSAGE, rateLimitedForSeconds: Math.max(short.retryAfterSeconds, daily.retryAfterSeconds) };
  }

  await recordRateLimitEvent(ipBucket);

  // Honeypot: look successful to the bot, store nothing.
  const decoy = raw[LEAD_HONEYPOT_FIELD];
  if (typeof decoy === "string" && decoy.trim() !== "") {
    return { ok: true, duplicate: false };
  }

  const [settings, options] = await Promise.all([getConsultationFormSettings({ strict: true }), getConsultationFormOptions()]);
  const result = validateConsultationSubmission(settings, raw, options);

  if (!result.ok) {
    return { ok: false, errors: result.errors, message: "Please correct the highlighted fields." };
  }

  const { clean } = result;
  const treatmentId = clean.treatment?.kind === "city" ? clean.treatment.id : null;
  let globalTreatmentId = clean.treatment?.kind === "global" ? clean.treatment.id : null;

  // A city treatment that is linked to a global concept records that link too, so reports can group by it.
  if (treatmentId !== null) {
    const linked = await prisma.treatments.findUnique({ where: { id: treatmentId }, select: { global_treatment_id: true } });
    globalTreatmentId = linked?.global_treatment_id ?? null;
  }

  const duplicate = await prisma.appointment_leads.findFirst({
    where: {
      deleted_at: null,
      phone_number: clean.phone,
      city_id: clean.cityId,
      treatment_id: treatmentId,
      global_treatment_id: globalTreatmentId,
      created_at: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) },
    },
    select: { id: true },
  });

  if (duplicate) {
    return { ok: true, duplicate: true };
  }

  const phoneBucket = rateLimitKey("lead:phone", clean.phone);
  const phoneLimit = await checkRateLimit(phoneBucket, PHONE_LIMIT, PHONE_WINDOW_MS);

  if (phoneLimit.limited) {
    return { ok: false, errors: {}, message: RATE_LIMIT_MESSAGE, rateLimitedForSeconds: phoneLimit.retryAfterSeconds };
  }

  await recordRateLimitEvent(phoneBucket);

  const [firstName, ...rest] = clean.fullName.split(" ");

  // Label snapshots for city/treatment live alongside the custom answers, so
  // a later rename or deletion never changes what this visitor actually chose.
  const extraData = [
    ...(clean.cityName ? [{ key: "city", label: "City", value: clean.cityName }] : []),
    ...(clean.treatment ? [{ key: "treatment", label: "Treatment", value: clean.treatment.name }] : []),
    ...clean.extra,
  ];

  await prisma.appointment_leads.create({
    data: {
      first_name: firstName,
      last_name: rest.join(" "),
      email: clean.email,
      phone_number: clean.phone,
      city_id: clean.cityId,
      treatment_id: treatmentId,
      global_treatment_id: globalTreatmentId,
      extra_data: extraData.length > 0 ? extraData : undefined,
    },
  });

  return { ok: true, duplicate: false };
}
