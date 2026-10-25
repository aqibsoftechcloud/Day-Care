import { AIProviderRequestError, type AIContentInput, type AIContentResult, type AIProvider, type AIProviderConfig } from "./types";

/**
 * Gemini adapter, using the "generateContent" REST surface
 * (POST {baseUrl}/models/{model}:generateContent), verified current against
 * ai.google.dev as of this implementation — chosen over Google's newer
 * "Interactions API" because it's stateless/single-shot (matching our
 * AIConfiguration's plain base_url+model shape) and its structured-JSON-
 * output fields, while marked deprecated, are confirmed still fully
 * functional. See lib/ai/prompt-builder.ts for what actually gets sent.
 *
 * Auth uses the `x-goog-api-key` HEADER (Google's own current guidance),
 * never the older `?key=` query-string form — a URL containing the key is
 * exactly the kind of thing that ends up in proxy/CDN access logs.
 */

const REQUEST_TIMEOUT_MS = 30_000;
const RETRYABLE_STATUS_CODES = new Set([429, 503]);
const RETRY_DELAY_MS = 1000;

type GeminiGenerateContentResponse = {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
};

type GeminiErrorResponse = {
  error?: { message?: string; status?: string };
};

function buildRequestBody(input: AIContentInput) {
  return {
    contents: [{ role: "user", parts: [{ text: input.prompt }] }],
    ...(input.systemPrompt ? { systemInstruction: { parts: { text: input.systemPrompt } } } : {}),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      ...(input.responseSchema
        ? { responseMimeType: "application/json", responseSchema: input.responseSchema }
        : {}),
    },
  };
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiProvider implements AIProvider {
  constructor(private readonly config: AIProviderConfig) {}

  async generateContent(input: AIContentInput): Promise<AIContentResult> {
    const url = `${this.config.baseUrl}/models/${this.config.model}:generateContent`;
    const body = JSON.stringify(buildRequestBody(input));

    let lastError: unknown;

    // Bounded, non-exponential retry — one extra attempt, only for
    // transient statuses. 400/401/403/404 fail immediately since retrying
    // a bad request or bad credentials can never succeed.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) {
        await sleep(RETRY_DELAY_MS);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.config.apiKey,
          },
          body,
          signal: controller.signal,
        });

        if (!response.ok) {
          if (RETRYABLE_STATUS_CODES.has(response.status) && attempt === 0) {
            lastError = new AIProviderRequestError("gemini", `provider returned status ${response.status}`);
            continue;
          }

          const safeMessage = await extractSafeErrorMessage(response);
          throw new AIProviderRequestError("gemini", safeMessage);
        }

        return parseSuccessResponse(await response.json(), this.config.model);
      } catch (error) {
        if (error instanceof AIProviderRequestError) {
          throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
          throw new AIProviderRequestError("gemini", "request timed out");
        }

        lastError = error;
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new AIProviderRequestError(
      "gemini",
      lastError instanceof Error ? lastError.message : "request failed after retry"
    );
  }
}

async function extractSafeErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as GeminiErrorResponse;
    if (body.error?.message) {
      // The provider's message is passed through as-is (it's Google's own
      // human-readable description, e.g. "API key not valid") — never the
      // raw response body, never headers, never the key itself.
      return body.error.message;
    }
  } catch {
    // Non-JSON error body — fall through to the generic status message.
  }

  return `provider returned status ${response.status}`;
}

function parseSuccessResponse(data: GeminiGenerateContentResponse, model: string): AIContentResult {
  if (data.promptFeedback?.blockReason) {
    throw new AIProviderRequestError("gemini", `content generation was blocked (${data.promptFeedback.blockReason})`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new AIProviderRequestError("gemini", "provider returned no generated content");
  }

  return { text, provider: "gemini", model };
}
