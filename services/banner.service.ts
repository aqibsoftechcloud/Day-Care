import { prisma } from "@/lib/prisma";
import { storageProvider } from "@/lib/storage";
import type {
  CreateBannerInput,
  UpdateBannerInput,
} from "@/validators/banner.validator";

export class BannerNotFoundError extends Error {
  constructor(id: number) {
    super(`Banner with id ${id} not found`);
    this.name = "BannerNotFoundError";
  }
}

export class CityNotFoundError extends Error {
  constructor(cityId: number) {
    super(`City with id ${cityId} not found`);
    this.name = "CityNotFoundError";
  }
}

export class BannerImageRequiredError extends Error {
  constructor() {
    super("banner_image is required");
    this.name = "BannerImageRequiredError";
  }
}

export type BannerImageInput = { buffer: Buffer; mimeType: string };

export type BannerFilesInput = {
  banner_image?: BannerImageInput;
  mobile_banner_image?: BannerImageInput;
};

const BANNER_UPLOAD_FOLDER = "banners";

async function ensureCityExists(cityId: number) {
  const city = await prisma.cities.findUnique({ where: { id: cityId } });

  if (!city) {
    throw new CityNotFoundError(cityId);
  }
}

export function getBanners() {
  return prisma.banners.findMany({
    orderBy: [{ sorting_order: "asc" }, { id: "asc" }],
  });
}

export async function getBannerById(id: number) {
  const banner = await prisma.banners.findUnique({ where: { id } });

  if (!banner) {
    throw new BannerNotFoundError(id);
  }

  return banner;
}

export async function createBanner(
  data: CreateBannerInput,
  files: BannerFilesInput
) {
  await ensureCityExists(data.city_id);

  if (!files.banner_image) {
    throw new BannerImageRequiredError();
  }

  const bannerImagePath = await storageProvider.upload(
    files.banner_image,
    BANNER_UPLOAD_FOLDER
  );

  const mobileBannerImagePath = files.mobile_banner_image
    ? await storageProvider.upload(files.mobile_banner_image, BANNER_UPLOAD_FOLDER)
    : null;

  return prisma.banners.create({
    data: {
      ...data,
      banner_image: bannerImagePath,
      mobile_banner_image: mobileBannerImagePath,
    },
  });
}

export async function updateBanner(
  id: number,
  data: UpdateBannerInput,
  files: BannerFilesInput
) {
  const current = await getBannerById(id);

  if (data.city_id !== undefined) {
    await ensureCityExists(data.city_id);
  }

  const updateData: UpdateBannerInput & {
    updated_at: Date;
    banner_image?: string;
    mobile_banner_image?: string | null;
  } = { ...data, updated_at: new Date() };

  if (files.banner_image) {
    updateData.banner_image = await storageProvider.upload(
      files.banner_image,
      BANNER_UPLOAD_FOLDER
    );

    await storageProvider
      .delete(current.banner_image)
      .catch((error) => console.error("Failed to delete old banner image:", error));
  }

  if (files.mobile_banner_image) {
    updateData.mobile_banner_image = await storageProvider.upload(
      files.mobile_banner_image,
      BANNER_UPLOAD_FOLDER
    );

    if (current.mobile_banner_image) {
      await storageProvider
        .delete(current.mobile_banner_image)
        .catch((error) =>
          console.error("Failed to delete old mobile banner image:", error)
        );
    }
  }

  return prisma.banners.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Soft delete: deactivates the banner by setting status to "inactive".
 * Image files are intentionally preserved (not deleted), so the banner
 * can be safely reactivated later without re-uploading images.
 */
export async function deleteBanner(id: number) {
  await getBannerById(id);

  await prisma.banners.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
