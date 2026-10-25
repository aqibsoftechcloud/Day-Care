/**
 * The ONLY localStorage touchpoint for authentication in this app. Stores
 * exactly one key — the already-encrypted external user id returned by
 * the login response. This value is NOT an authentication mechanism: it
 * is never sent to the server and never used to authorize anything. It
 * exists purely as a client-side reference (e.g. so the UI can avoid a
 * flash-of-logged-out-state before the real /api/auth/me check resolves).
 *
 * The actual authentication token lives only in the HttpOnly `session`
 * cookie and is never readable from JavaScript, by design.
 *
 * Do NOT add any other key here (no token, role, permissions, user
 * object, email, etc.) — see lib/auth/AuthProvider.tsx for where those
 * live instead (React state only, never persisted).
 */

const USER_ID_KEY = "dcs_user_id";

function isStorageAvailable(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getStoredUserId(): string | null {
  if (!isStorageAvailable()) return null;

  try {
    return window.localStorage.getItem(USER_ID_KEY);
  } catch {
    return null;
  }
}

export function setStoredUserId(userId: string): void {
  if (!isStorageAvailable()) return;

  try {
    window.localStorage.setItem(USER_ID_KEY, userId);
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — non-fatal,
    // the app still works via the HttpOnly cookie + runtime state.
  }
}

export function clearStoredUserId(): void {
  if (!isStorageAvailable()) return;

  try {
    window.localStorage.removeItem(USER_ID_KEY);
  } catch {
    // Non-fatal — see setStoredUserId.
  }
}
