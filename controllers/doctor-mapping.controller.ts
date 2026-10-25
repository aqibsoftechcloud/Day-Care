import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  doctorMappingParamSchema,
  syncDoctorHospitalsSchema,
  syncDoctorSpecialitiesSchema,
} from "@/validators/doctor-mapping.validator";
import {
  DoctorNotFoundError,
  DoctorSpecialityNotFoundError,
  getDoctorHospitals,
  getDoctorSpecialityMappings,
  HospitalCityMismatchError,
  HospitalNotActiveError,
  HospitalNotFoundError,
  syncDoctorHospitals,
  syncDoctorSpecialityMappings,
} from "@/services/doctor-mapping.service";

function handleError(error: unknown) {
  const authResponse = tryHandleAuthorizationError(error);
  if (authResponse) {
    return authResponse;
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: "Validation failed",
        errors: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  if (
    error instanceof DoctorNotFoundError ||
    error instanceof HospitalNotFoundError ||
    error instanceof DoctorSpecialityNotFoundError
  ) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (
    error instanceof HospitalNotActiveError ||
    error instanceof HospitalCityMismatchError
  ) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function getDoctorHospitalsHandler(params: { id: string }) {
  try {
    await requirePermission("doctors", "view");
    const { id } = doctorMappingParamSchema.parse(params);
    const hospitals = await getDoctorHospitals(id);

    return NextResponse.json({ success: true, hospitals });
  } catch (error) {
    return handleError(error);
  }
}

export async function syncDoctorHospitalsHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("doctors", "update");
    const { id } = doctorMappingParamSchema.parse(params);
    const body = await request.json();
    const data = syncDoctorHospitalsSchema.parse(body);
    const hospitals = await syncDoctorHospitals(id, data);

    return NextResponse.json({ success: true, hospitals });
  } catch (error) {
    return handleError(error);
  }
}

export async function getDoctorSpecialitiesHandler(params: { id: string }) {
  try {
    await requirePermission("doctors", "view");
    const { id } = doctorMappingParamSchema.parse(params);
    const doctorSpecialities = await getDoctorSpecialityMappings(id);

    return NextResponse.json({ success: true, doctorSpecialities });
  } catch (error) {
    return handleError(error);
  }
}

export async function syncDoctorSpecialitiesHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("doctors", "update");
    const { id } = doctorMappingParamSchema.parse(params);
    const body = await request.json();
    const data = syncDoctorSpecialitiesSchema.parse(body);
    const doctorSpecialities = await syncDoctorSpecialityMappings(id, data);

    return NextResponse.json({ success: true, doctorSpecialities });
  } catch (error) {
    return handleError(error);
  }
}
