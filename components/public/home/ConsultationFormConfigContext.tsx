"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  DEFAULT_CONSULTATION_FORM_SETTINGS,
  EMPTY_CONSULTATION_FORM_OPTIONS,
  type PublicConsultationForm,
} from "@/types/consultation-form-settings";

/**
 * Default value is the built-in default form — if this provider is ever
 * missing above an `AppointmentLeadForm` instance (it shouldn't be,
 * `app/(public)/layout.tsx` wraps every public route), the form still
 * renders the fallback instead of throwing or showing `undefined`.
 */
const ConsultationFormConfigContext = createContext<PublicConsultationForm>({
  settings: DEFAULT_CONSULTATION_FORM_SETTINGS,
  options: EMPTY_CONSULTATION_FORM_OPTIONS,
});

/**
 * Resolved exactly once, server-side, in `app/(public)/layout.tsx` and
 * handed down via context — `AppointmentLeadForm` is a client component
 * rendered from many different server components (Homepage Hero,
 * Treatment/Speciality Hero + Final CTA, Global Hero + Final CTA, Hospital
 * Hero), so context avoids threading the saved form configuration and
 * the city/treatment option lists as props through every one of those
 * call sites, and avoids each form instance fetching its own copy.
 */
export function ConsultationFormConfigProvider({
  config,
  children,
}: {
  config: PublicConsultationForm;
  children: ReactNode;
}) {
  return <ConsultationFormConfigContext.Provider value={config}>{children}</ConsultationFormConfigContext.Provider>;
}

export function useConsultationForm(): PublicConsultationForm {
  return useContext(ConsultationFormConfigContext);
}
