import { apiFetch } from "./client";
import type { GenerateSpecialityContentInput, SpecialityGeneratedContent } from "@/types/ai-generation";

type GenerateContentResponse = { success: true; content: SpecialityGeneratedContent };

/**
 * Calls only our own CMS API — never the provider directly. The browser
 * never sees a provider base URL, model routing, or an API key; all of
 * that is resolved server-side from the active AI configuration.
 */
export function generateSpecialityContent(data: GenerateSpecialityContentInput) {
  return apiFetch<GenerateContentResponse>("/api/ai/generate", { method: "POST", body: data });
}
