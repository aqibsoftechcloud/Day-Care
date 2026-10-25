import { LocalStorageProvider } from "./local-storage-provider";
import type { StorageProvider } from "./types";

export type { StorageProvider, UploadInput } from "./types";

/**
 * The single seam for swapping storage backends. To migrate to MinIO,
 * implement `MinioStorageProvider` (satisfying the same `StorageProvider`
 * interface) and change only this line — no controller/service changes.
 */
export const storageProvider: StorageProvider = new LocalStorageProvider();
