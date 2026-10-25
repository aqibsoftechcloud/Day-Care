import { prisma } from "@/lib/prisma";
import type {
  SyncDoctorHospitalsInput,
  SyncDoctorSpecialitiesInput,
} from "@/validators/doctor-mapping.validator";

export class DoctorNotFoundError extends Error {
  constructor(id: number) {
    super(`Doctor with id ${id} not found`);
    this.name = "DoctorNotFoundError";
  }
}

export class HospitalNotFoundError extends Error {
  constructor(id: number) {
    super(`Hospital with id ${id} not found`);
    this.name = "HospitalNotFoundError";
  }
}

export class HospitalNotActiveError extends Error {
  constructor(id: number) {
    super(`Hospital with id ${id} is not active`);
    this.name = "HospitalNotActiveError";
  }
}

export class HospitalCityMismatchError extends Error {
  constructor(id: number, doctorCityId: number) {
    super(`Hospital with id ${id} does not belong to city ${doctorCityId}`);
    this.name = "HospitalCityMismatchError";
  }
}

export class DoctorSpecialityNotFoundError extends Error {
  constructor(id: number) {
    super(`Doctor speciality with id ${id} not found`);
    this.name = "DoctorSpecialityNotFoundError";
  }
}

async function ensureDoctorExists(doctorId: number) {
  const doctor = await prisma.doctors.findUnique({ where: { id: doctorId } });

  if (!doctor) {
    throw new DoctorNotFoundError(doctorId);
  }

  return doctor;
}

/**
 * Validates existence, active status, and city membership for every
 * hospital id being assigned — the authoritative half of the city-scoped
 * assignment rule; frontend option-filtering (active + doctor's city only)
 * is the non-authoritative other half, same precedent as menu target
 * city-scoping in services/menu.service.ts.
 */
async function ensureHospitalsValidForDoctor(hospitalIds: number[], doctorCityId: number) {
  if (hospitalIds.length === 0) return;

  const found = await prisma.hospitals.findMany({
    where: { id: { in: hospitalIds } },
    select: { id: true, city_id: true, status: true },
  });

  const foundById = new Map(found.map((hospital) => [hospital.id, hospital]));

  for (const id of hospitalIds) {
    const hospital = foundById.get(id);

    if (!hospital) {
      throw new HospitalNotFoundError(id);
    }
    if (hospital.status !== "active") {
      throw new HospitalNotActiveError(id);
    }
    if (hospital.city_id !== doctorCityId) {
      throw new HospitalCityMismatchError(id, doctorCityId);
    }
  }
}

async function ensureDoctorSpecialitiesExist(doctorSpecialityIds: number[]) {
  if (doctorSpecialityIds.length === 0) return;

  const found = await prisma.doctor_specialities.findMany({
    where: { id: { in: doctorSpecialityIds } },
    select: { id: true },
  });

  const foundIds = new Set(found.map((speciality) => speciality.id));
  const missing = doctorSpecialityIds.find((id) => !foundIds.has(id));

  if (missing !== undefined) {
    throw new DoctorSpecialityNotFoundError(missing);
  }
}

export async function getDoctorHospitals(doctorId: number) {
  await ensureDoctorExists(doctorId);

  const mappings = await prisma.doctor_hospitals.findMany({
    where: { doctor_id: doctorId },
    select: {
      hospitals: { select: { id: true, hospital_name: true, seo_url: true } },
    },
    orderBy: { hospital_id: "asc" },
  });

  return mappings.map((mapping) => mapping.hospitals);
}

/**
 * Public-facing variant of `getDoctorHospitals`: only hospitals that are
 * BOTH mapped to this doctor AND currently active. Kept as its own
 * function rather than adding a filter to `getDoctorHospitals` itself —
 * that function backs the admin mapping dialog, which intentionally
 * needs to see every current mapping (including ones to a since-
 * deactivated hospital) so an admin can clean it up; the public Doctor
 * Detail page must never show an inactive hospital at all.
 */
export async function getActiveDoctorHospitals(doctorId: number) {
  const mappings = await prisma.doctor_hospitals.findMany({
    where: { doctor_id: doctorId, hospitals: { status: "active" } },
    select: {
      hospitals: {
        select: {
          id: true,
          hospital_name: true,
          seo_url: true,
          hospital_image: true,
          address: true,
          cities: { select: { seo_url: true, city_name: true } },
        },
      },
    },
    orderBy: { hospital_id: "asc" },
  });

  return mappings.map((mapping) => mapping.hospitals);
}

/**
 * Replaces the full set of hospitals mapped to a doctor with the given
 * list: adds mappings that are missing, removes mappings no longer
 * present, and leaves unchanged mappings untouched. Runs as a single
 * transaction so the doctor's hospital mapping is never left partially
 * synchronized.
 */
export async function syncDoctorHospitals(
  doctorId: number,
  data: SyncDoctorHospitalsInput
) {
  const doctor = await ensureDoctorExists(doctorId);
  await ensureHospitalsValidForDoctor(data.hospital_ids, doctor.city_id);

  const existing = await prisma.doctor_hospitals.findMany({
    where: { doctor_id: doctorId },
    select: { hospital_id: true },
  });

  const existingIds = new Set(existing.map((row) => row.hospital_id));
  const nextIds = new Set(data.hospital_ids);

  const toAdd = data.hospital_ids.filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));

  await prisma.$transaction([
    ...(toRemove.length > 0
      ? [
          prisma.doctor_hospitals.deleteMany({
            where: { doctor_id: doctorId, hospital_id: { in: toRemove } },
          }),
        ]
      : []),
    ...(toAdd.length > 0
      ? [
          prisma.doctor_hospitals.createMany({
            data: toAdd.map((hospital_id) => ({
              doctor_id: doctorId,
              hospital_id,
            })),
          }),
        ]
      : []),
  ]);

  return getDoctorHospitals(doctorId);
}

export async function getDoctorSpecialityMappings(doctorId: number) {
  await ensureDoctorExists(doctorId);

  const mappings = await prisma.doctor_speciality_mappings.findMany({
    where: { doctor_id: doctorId },
    select: {
      doctor_specialities: {
        select: { id: true, speciality_name: true, seo_url: true },
      },
    },
    orderBy: { doctor_speciality_id: "asc" },
  });

  return mappings.map((mapping) => mapping.doctor_specialities);
}

/**
 * Public-facing variant of `getDoctorSpecialityMappings`: only active
 * `doctor_specialities` taxonomy rows — same "admin sees everything
 * including stale/inactive, public never does" split as
 * `getActiveDoctorHospitals`.
 */
export async function getActiveDoctorSpecialityMappings(doctorId: number) {
  const mappings = await prisma.doctor_speciality_mappings.findMany({
    where: { doctor_id: doctorId, doctor_specialities: { status: "active" } },
    select: {
      doctor_specialities: {
        select: { id: true, speciality_name: true, seo_url: true },
      },
    },
    orderBy: { doctor_speciality_id: "asc" },
  });

  return mappings.map((mapping) => mapping.doctor_specialities);
}

/**
 * Replaces the full set of doctor specialities mapped to a doctor with the
 * given list: adds mappings that are missing, removes mappings no longer
 * present, and leaves unchanged mappings untouched. Runs as a single
 * transaction so the doctor's speciality mapping is never left partially
 * synchronized.
 */
export async function syncDoctorSpecialityMappings(
  doctorId: number,
  data: SyncDoctorSpecialitiesInput
) {
  await ensureDoctorExists(doctorId);
  await ensureDoctorSpecialitiesExist(data.doctor_speciality_ids);

  const existing = await prisma.doctor_speciality_mappings.findMany({
    where: { doctor_id: doctorId },
    select: { doctor_speciality_id: true },
  });

  const existingIds = new Set(
    existing.map((row) => row.doctor_speciality_id)
  );
  const nextIds = new Set(data.doctor_speciality_ids);

  const toAdd = data.doctor_speciality_ids.filter(
    (id) => !existingIds.has(id)
  );
  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));

  await prisma.$transaction([
    ...(toRemove.length > 0
      ? [
          prisma.doctor_speciality_mappings.deleteMany({
            where: {
              doctor_id: doctorId,
              doctor_speciality_id: { in: toRemove },
            },
          }),
        ]
      : []),
    ...(toAdd.length > 0
      ? [
          prisma.doctor_speciality_mappings.createMany({
            data: toAdd.map((doctor_speciality_id) => ({
              doctor_id: doctorId,
              doctor_speciality_id,
            })),
          }),
        ]
      : []),
  ]);

  return getDoctorSpecialityMappings(doctorId);
}

/**
 * Reverse of getDoctorSpecialityMappings(): active doctors mapped to one
 * `doctor_specialities` taxonomy id, optionally scoped to one city — the
 * "which doctors treat this speciality" query the public Speciality
 * Doctors section needs, which nothing in this file previously supported
 * (this file's other functions all start from a known `doctorId`). One
 * join query (doctor_speciality_mappings -> doctors), not the per-doctor
 * N+1 pattern lib/public/homepage.ts's getHomepageDoctors() uses — that
 * pattern is acknowledged there as something not to copy for a
 * performance-conscious query like this one.
 */
export async function getDoctorsByDoctorSpeciality(doctorSpecialityId: number, cityId?: number) {
  const mappings = await prisma.doctor_speciality_mappings.findMany({
    where: {
      doctor_speciality_id: doctorSpecialityId,
      doctors: {
        status: "active",
        ...(cityId !== undefined ? { city_id: cityId } : {}),
      },
    },
    select: {
      doctors: {
        select: {
          id: true,
          doctor_name: true,
          seo_url: true,
          qualification: true,
          experience: true,
          patient_satisfaction_score: true,
          doctor_image: true,
          cities: { select: { seo_url: true } },
        },
      },
    },
    orderBy: { doctor_id: "asc" },
  });

  return mappings.map((mapping) => mapping.doctors);
}

/**
 * The reverse of `getDoctorHospitals(doctorId)`: active doctors mapped to
 * one hospital via `doctor_hospitals` — the real Hospital ↔ Doctor
 * relationship, never inferred from city. `doctor_hospitals`' own
 * composite primary key (`[doctor_id, hospital_id]`) already guarantees
 * each doctor appears at most once per hospital, so no extra
 * dedup is needed here.
 *
 * Also resolves each doctor's own "first mapped `doctor_specialities` row"
 * label (same semantics as `HomepageDoctor.specialityName` — see
 * lib/public/homepage.ts) via one batched second query keyed on the
 * doctor ids already fetched, rather than the per-doctor N+1 pattern
 * `getHomepageDoctors()` uses. This is deliberately NOT the same thing as
 * `getDoctorsByDoctorSpeciality` (taxonomy ↔ doctor) and does not touch
 * or imply any relationship to the clinical `specialities` table —
 * a hospital's own linked clinical specialities are a completely
 * separate relationship (`specialities.hospital_id`), resolved
 * independently in lib/public/hospitals.ts.
 */
export async function getDoctorsByHospital(hospitalId: number) {
  const mappings = await prisma.doctor_hospitals.findMany({
    where: {
      hospital_id: hospitalId,
      doctors: { status: "active" },
    },
    select: {
      doctors: {
        select: {
          id: true,
          doctor_name: true,
          seo_url: true,
          qualification: true,
          experience: true,
          patient_satisfaction_score: true,
          doctor_image: true,
          cities: { select: { seo_url: true } },
        },
      },
    },
    orderBy: { doctor_id: "asc" },
  });

  const doctors = mappings.map((mapping) => mapping.doctors);

  if (doctors.length === 0) {
    return [];
  }

  const specialityMappings = await prisma.doctor_speciality_mappings.findMany({
    where: { doctor_id: { in: doctors.map((doctor) => doctor.id) } },
    select: { doctor_id: true, doctor_specialities: { select: { speciality_name: true } } },
    orderBy: { doctor_speciality_id: "asc" },
  });

  const firstSpecialityNameByDoctorId = new Map<number, string>();
  for (const mapping of specialityMappings) {
    if (!firstSpecialityNameByDoctorId.has(mapping.doctor_id)) {
      firstSpecialityNameByDoctorId.set(mapping.doctor_id, mapping.doctor_specialities.speciality_name);
    }
  }

  return doctors.map((doctor) => ({
    ...doctor,
    specialityName: firstSpecialityNameByDoctorId.get(doctor.id) ?? null,
  }));
}
