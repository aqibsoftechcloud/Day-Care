/**
 * Centralized prompt construction for AI-assisted CMS content — the one
 * place that knows what a "responsible healthcare draft" prompt looks
 * like, so it's never duplicated (or drifted) inside a React component or
 * a controller. Provider-agnostic: returns plain { systemPrompt, prompt,
 * responseSchema }, which services/ai-generation.service.ts feeds into the
 * existing generateAIContent() — this file never touches a provider
 * adapter, an API key, or a network call.
 */

/** JSON schema for the fields this generates — mirrors validators/speciality.validator.ts's real limits so nothing downstream can produce an unsaveable value. Only the fields that actually exist on the Speciality model/form. */
export const SPECIALITY_CONTENT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    description: { type: "string" },
    short_description: { type: "string" },
    meta_title: { type: "string" },
    meta_description: { type: "string" },
    meta_keyword: { type: "string" },
  },
  required: ["description", "short_description", "meta_title", "meta_description", "meta_keyword"],
} as const;

const HEALTHCARE_CONTENT_SYSTEM_PROMPT = `You are a professional healthcare website content writer helping draft content for a day care surgery / hospital speciality page.

Rules you must follow:
- The content is for a real healthcare website and must be medically responsible.
- Do not invent statistics, success rates, or numbers of any kind.
- Do not invent or name specific doctors, hospitals, or treatments that were not given to you.
- Do not make unsupported or exaggerated medical claims.
- Do not provide a diagnosis or medical advice directed at an individual reader.
- Do not guarantee outcomes ("guaranteed cure", "100% success", etc.).
- Do not fabricate citations, studies, or references.
- Write professional, clear, website-ready draft copy — not a clinical paper, not marketing hype.
- Everything you produce is a DRAFT that a human editor will review, fact-check, and approve before publishing — never present it as final or already reviewed.

Respond with only the requested JSON object — no commentary, no markdown fences, no extra keys.`;

export type SpecialityContentPromptContext = {
  speciality_name: string;
  speciality_title?: string;
  city_name?: string;
  /** Whatever the admin has already typed, if anything — passed as a hint so generation can build on it instead of ignoring it. */
  existing_short_description?: string;
};

export type SpecialityContentPrompt = {
  systemPrompt: string;
  prompt: string;
  responseSchema: typeof SPECIALITY_CONTENT_RESPONSE_SCHEMA;
};

export function buildSpecialityContentPrompt(context: SpecialityContentPromptContext): SpecialityContentPrompt {
  const lines = [
    `Write draft website content for a medical speciality page with these details:`,
    `- Speciality name: ${context.speciality_name}`,
  ];

  if (context.speciality_title) {
    lines.push(`- Display title: ${context.speciality_title}`);
  }
  if (context.city_name) {
    lines.push(`- City: ${context.city_name}`);
  }
  if (context.existing_short_description) {
    lines.push(`- Existing short description to build on (improve/expand rather than contradict): ${context.existing_short_description}`);
  }

  lines.push(
    "",
    "Produce a JSON object with exactly these fields:",
    "- description: 3-5 paragraphs of semantic HTML (use <p>, <h2>/<h3>, <ul>/<li> where appropriate) introducing the speciality, what it treats, and what patients can expect. No <script>, no inline event handlers, no <style>.",
    "- short_description: one or two sentences, plain text, suitable for a card/summary.",
    "- meta_title: an SEO title, plain text, under 60 characters.",
    "- meta_description: an SEO meta description, plain text, under 160 characters.",
    "- meta_keyword: a short comma-separated list of relevant SEO keywords, plain text."
  );

  return {
    systemPrompt: HEALTHCARE_CONTENT_SYSTEM_PROMPT,
    prompt: lines.join("\n"),
    responseSchema: SPECIALITY_CONTENT_RESPONSE_SCHEMA,
  };
}
