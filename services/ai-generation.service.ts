import { z } from "zod";
import { buildSpecialityContentPrompt, type SpecialityContentPromptContext } from "@/lib/ai/prompt-builder";
import { generateAIContent } from "@/services/ai.service";

export class AIGenerationResultInvalidError extends Error {
  constructor(reason: string) {
    super(`The AI provider's response could not be used: ${reason}`);
    this.name = "AIGenerationResultInvalidError";
  }
}

// Mirrors validators/speciality.validator.ts's real field limits — the
// generated content can never be shaped into something the existing
// Speciality save flow would reject. "Do not blindly trust provider
// output" (this is the trust boundary): the model's raw text is parsed
// and validated here before anything downstream ever sees it.
const specialityContentResultSchema = z.object({
  description: z.string().trim().min(1, "description is empty"),
  short_description: z.string().trim().min(1, "short_description is empty"),
  meta_title: z.string().trim().min(1, "meta_title is empty").max(255, "meta_title exceeds 255 characters"),
  meta_description: z.string().trim().min(1, "meta_description is empty"),
  meta_keyword: z.string().trim().min(1, "meta_keyword is empty").max(500, "meta_keyword exceeds 500 characters"),
});

export type SpecialityGeneratedContent = z.infer<typeof specialityContentResultSchema>;

/**
 * Domain-aware orchestration layer, sitting above the generic
 * services/ai.service.ts (which knows nothing about "Speciality" — that
 * genericity is deliberate and untouched). This is the only place that
 * knows how to turn Speciality form context into a prompt and turn the
 * model's raw text back into Speciality-shaped, validated content.
 */
export async function generateSpecialityContent(
  context: SpecialityContentPromptContext
): Promise<SpecialityGeneratedContent> {
  const { systemPrompt, prompt, responseSchema } = buildSpecialityContentPrompt(context);

  const result = await generateAIContent({ prompt, systemPrompt, responseSchema });

  let parsed: unknown;

  try {
    parsed = JSON.parse(result.text);
  } catch {
    throw new AIGenerationResultInvalidError("the provider did not return valid JSON");
  }

  const validated = specialityContentResultSchema.safeParse(parsed);

  if (!validated.success) {
    throw new AIGenerationResultInvalidError(validated.error.issues.map((issue) => issue.message).join("; "));
  }

  return validated.data;
}
