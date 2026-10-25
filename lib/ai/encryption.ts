import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Authenticated encryption (AES-256-GCM) for AI provider API keys at rest.
 *
 * Deliberately NOT lib/user-id.ts's CryptoJS helper: that one uses AES-CBC
 * with no authentication tag, which is adequate for round-tripping a
 * numeric id but not for a real secret — a tampered ciphertext there would
 * just decrypt to garbage instead of failing loudly. GCM's auth tag makes
 * any tampering (or use of the wrong key) throw instead of silently
 * returning corrupted plaintext.
 *
 * The key lives only in AI_CONFIG_ENCRYPTION_KEY (server env), never in
 * MySQL — only the ciphertext envelope below is ever persisted.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // 96-bit IV, the standard/recommended size for GCM

export class AIConfigEncryptionKeyMissingError extends Error {
  constructor() {
    super("AI_CONFIG_ENCRYPTION_KEY is not configured");
    this.name = "AIConfigEncryptionKeyMissingError";
  }
}

export class ApiKeyDecryptionError extends Error {
  constructor() {
    super("Failed to decrypt the stored API key — it may be corrupted or was encrypted with a different key");
    this.name = "ApiKeyDecryptionError";
  }
}

function getKey(): Buffer {
  const raw = process.env.AI_CONFIG_ENCRYPTION_KEY;

  if (!raw) {
    throw new AIConfigEncryptionKeyMissingError();
  }

  const key = Buffer.from(raw, "base64");

  if (key.length !== 32) {
    throw new AIConfigEncryptionKeyMissingError();
  }

  return key;
}

/**
 * Encrypts a plaintext API key into a storable envelope: base64 `iv`,
 * base64 `authTag`, and base64 `ciphertext`, joined with ".". A fresh
 * random IV is generated on every call, so encrypting the same key twice
 * produces different ciphertext (as GCM requires for a reused key).
 */
export function encryptApiKey(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv, authTag, ciphertext].map((buffer) => buffer.toString("base64")).join(".");
}

/**
 * Decrypts a stored envelope back into the plaintext API key. Only ever
 * called server-side from services/ai.service.ts when a provider call is
 * about to be made — never from a controller response path.
 */
export function decryptApiKey(stored: string): string {
  const key = getKey();
  const parts = stored.split(".");

  if (parts.length !== 3) {
    throw new ApiKeyDecryptionError();
  }

  const [ivB64, authTagB64, ciphertextB64] = parts;

  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(authTagB64, "base64"));

    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextB64, "base64")),
      decipher.final(),
    ]);

    return plaintext.toString("utf8");
  } catch {
    throw new ApiKeyDecryptionError();
  }
}
