/**
 * Storage abstraction — Banner (and future) business logic depends only on
 * this interface, never on a concrete provider or the filesystem directly.
 * Swapping the local filesystem for MinIO later means writing a new
 * `MinioStorageProvider` and changing the single export in
 * `lib/storage/index.ts`; nothing in controllers/services changes.
 */

export type UploadInput = {
  buffer: Buffer;
  mimeType: string;
};

export interface StorageProvider {
  /**
   * Stores a file and returns the value that should be persisted in the
   * database (a public path today; could be an object URL/key for MinIO).
   */
  upload(input: UploadInput, folder: string): Promise<string>;

  /**
   * Removes a previously stored file, referenced by the same value that
   * `upload` returned. Safe to call on a path that no longer exists.
   */
  delete(storedPath: string): Promise<void>;
}
