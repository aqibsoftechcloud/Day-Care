/**
 * Centralized frontend API client. Every request:
 * - sends `credentials: "include"` so the browser attaches the HttpOnly
 *   `session` cookie automatically — this is the ONLY authentication
 *   transport; no Authorization header is ever set here.
 * - parses the backend's consistent `{ success, message, ... }` shape.
 * - throws a typed ApiError with a status-appropriate, non-technical
 *   message on failure — callers/toasts never see raw stack traces.
 *
 * 401 handling is centralized via `setUnauthorizedHandler` (registered
 * once by AuthProvider) rather than duplicated in every call site. 403
 * deliberately does NOT trigger that handler — the session stays intact,
 * the caller just sees a permission error.
 */

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

type QueryValue = string | number | boolean | undefined | null;

export type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
};

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  if (!query) return path;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "The submitted data is invalid.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested item was not found.";
    case 409:
      return "This conflicts with an existing record.";
    case 500:
      return "Something went wrong on our end. Please try again.";
    default:
      return "An unexpected error occurred.";
  }
}

type BackendResponseShape = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { method = "GET", body, query } = options;
  const url = buildUrl(path, query);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      headers:
        !isFormData && body !== undefined
          ? { "Content-Type": "application/json" }
          : undefined,
      body: isFormData
        ? (body as FormData)
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to reach the server. Check your connection and try again."
    );
  }

  let data: BackendResponseShape | null = null;
  try {
    data = (await response.json()) as BackendResponseShape;
  } catch {
    // No/invalid JSON body — proceed with data = null.
  }

  if (!response.ok) {
    const message = data?.message || defaultMessageForStatus(response.status);

    if (response.status === 401) {
      unauthorizedHandler?.();
    }

    throw new ApiError(response.status, message, data?.errors);
  }

  return data as T;
}
