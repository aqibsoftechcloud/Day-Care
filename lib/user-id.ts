import CryptoJS from "crypto-js";

export class InvalidUserIdError extends Error {
  constructor() {
    super("Invalid user identifier");
    this.name = "InvalidUserIdError";
  }
}

function getEncryptionKey(): string {
  const key = process.env.USER_ID_ENCRYPTION_KEY;

  if (!key) {
    throw new Error("USER_ID_ENCRYPTION_KEY is not configured");
  }

  return key;
}

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const restored = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (restored.length % 4)) % 4;
  return restored + "=".repeat(padLength);
}

/**
 * Encrypts a numeric database user id into a URL-safe external identifier.
 * CryptoJS performs the encryption; Base64URL only makes the ciphertext
 * safe to place in a URL path segment.
 */
export function encryptUserId(id: number): string {
  const key = getEncryptionKey();
  const ciphertext = CryptoJS.AES.encrypt(String(id), key).toString();

  return toBase64Url(ciphertext);
}

/**
 * Decrypts an external user identifier back into the numeric database id.
 * Throws InvalidUserIdError for any malformed, tampered, or non-numeric
 * result instead of leaking decryption internals to the caller.
 */
export function decryptUserId(value: string): number {
  const key = getEncryptionKey();

  let decrypted: string;

  try {
    const ciphertext = fromBase64Url(value);
    decrypted = CryptoJS.AES.decrypt(ciphertext, key).toString(CryptoJS.enc.Utf8);
  } catch {
    throw new InvalidUserIdError();
  }

  if (!decrypted || !/^\d+$/.test(decrypted)) {
    throw new InvalidUserIdError();
  }

  const id = Number(decrypted);

  if (!Number.isInteger(id) || id <= 0) {
    throw new InvalidUserIdError();
  }

  return id;
}
