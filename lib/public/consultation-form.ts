import { getConsultationFormSettings } from "@/services/consultation-form-settings.service";
import { getConsultationFormOptions } from "@/services/consultation-lead.service";
import {
  DEFAULT_CONSULTATION_FORM_SETTINGS,
  EMPTY_CONSULTATION_FORM_OPTIONS,
  type PublicConsultationForm,
} from "@/types/consultation-form-settings";

/**
 * Resolves the shared consultation form for the whole public site: the
 * admin-saved configuration plus the trusted city/treatment option lists.
 * Called from exactly one place (app/(public)/layout.tsx). Not wrapped in
 * React's `cache()` — same precedent as `getPublicCities()`. On any failure (DB error or an invalid saved
 * config) it does NOT fall back to a made-up form: it returns `loadError`
 * so the form renders an explicit error + Retry, and public pages still
 * render. The server re-validates every submission against the real database.
 */
export async function getPublicConsultationForm(): Promise<PublicConsultationForm> {
  try {
    const [settings, options] = await Promise.all([withOneRetry(() => getConsultationFormSettings({ strict: true })), withOneRetry(getConsultationFormOptions)]);

    // Popular-city buttons only ever show cities that are active right now, in the admin's order.
    const activeIds = new Set(options.cities.map((c) => c.id));

    return {
      settings: {
        ...settings,
        // Disabled fields are never sent to the browser (the server re-reads the full config when validating a submission).
        fields: settings.fields.filter((field) => field.enabled),
        popular_city_ids: settings.popular_city_ids.filter((id) => activeIds.has(id)),
      },
      options,
    };
  } catch (error) {
    console.error("Failed to load the consultation form (showing an error state, not a default form):", error);
    return {
      settings: { ...DEFAULT_CONSULTATION_FORM_SETTINGS, fields: DEFAULT_CONSULTATION_FORM_SETTINGS.fields.map((f) => ({ ...f })) },
      options: EMPTY_CONSULTATION_FORM_OPTIONS,
      // Placeholder only — the form renders an error + Retry instead of these defaults.
      loadError: true,
    };
  }
}

/** One quick retry absorbs a transient connection drop; a second failure is thrown to the caller. */
async function withOneRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("Consultation form data failed to load, retrying once:", error);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return fn();
  }
}
