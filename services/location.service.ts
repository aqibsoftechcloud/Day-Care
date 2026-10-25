import { prisma } from "@/lib/prisma";
import type {
  CreateLocationInput,
  UpdateLocationInput,
} from "@/validators/location.validator";

export class LocationNotFoundError extends Error {
  constructor(id: number) {
    super(`Location with id ${id} not found`);
    this.name = "LocationNotFoundError";
  }
}

export class CityNotFoundError extends Error {
  constructor(cityId: number) {
    super(`City with id ${cityId} not found`);
    this.name = "CityNotFoundError";
  }
}

async function ensureCityExists(cityId: number) {
  const city = await prisma.cities.findUnique({ where: { id: cityId } });

  if (!city) {
    throw new CityNotFoundError(cityId);
  }
}

export function getLocations() {
  return prisma.locations.findMany({
    orderBy: { id: "asc" },
  });
}

export async function getLocationById(id: number) {
  const location = await prisma.locations.findUnique({ where: { id } });

  if (!location) {
    throw new LocationNotFoundError(id);
  }

  return location;
}

export async function createLocation(data: CreateLocationInput) {
  await ensureCityExists(data.city_id);

  return prisma.locations.create({ data });
}

export async function updateLocation(id: number, data: UpdateLocationInput) {
  await getLocationById(id);

  if (data.city_id !== undefined) {
    await ensureCityExists(data.city_id);
  }

  return prisma.locations.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
  });
}

/**
 * Soft delete: deactivates the location by setting status to "inactive".
 * Locations are referenced by doctor_pages/doctors/hospitals/pages/
 * specialities/testimonials/treatments, so they are never physically
 * removed — matching the convention already used for modules, users,
 * languages, and cities.
 */
export async function deleteLocation(id: number) {
  await getLocationById(id);

  await prisma.locations.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
