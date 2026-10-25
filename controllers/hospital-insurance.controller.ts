import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  addHospitalInsuranceCompanySchema,
  hospitalInsuranceHospitalIdParamSchema,
  hospitalInsuranceIdParamSchema,
  reorderHospitalInsuranceCompaniesSchema,
} from "@/validators/hospital-insurance.validator";
import {
  addHospitalInsuranceCompany,
  DuplicateHospitalInsuranceMappingError,
  getHospitalInsuranceCompanies,
  HospitalInsuranceMappingNotFoundError,
  HospitalNotFoundError,
  InsuranceCompanyNotFoundError,
  removeHospitalInsuranceCompany,
  reorderHospitalInsuranceCompanies,
} from "@/services/hospital-insurance.service";

function handleError(error: unknown) {
  const authResponse = tryHandleAuthorizationError(error);
  if (authResponse) {
    return authResponse;
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { success: false, message: "Validation failed", errors: error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (error instanceof DuplicateHospitalInsuranceMappingError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 409 });
  }

  if (
    error instanceof HospitalNotFoundError ||
    error instanceof InsuranceCompanyNotFoundError ||
    error instanceof HospitalInsuranceMappingNotFoundError
  ) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function listHospitalInsuranceCompaniesHandler(params: { hospitalId: string }) {
  try {
    await requirePermission("hospitals", "view");
    const { hospitalId } = hospitalInsuranceHospitalIdParamSchema.parse(params);
    const mappings = await getHospitalInsuranceCompanies(hospitalId);

    return NextResponse.json({ success: true, mappings });
  } catch (error) {
    return handleError(error);
  }
}

export async function addHospitalInsuranceCompanyHandler(request: NextRequest, params: { hospitalId: string }) {
  try {
    await requirePermission("hospitals", "update");
    const { hospitalId } = hospitalInsuranceHospitalIdParamSchema.parse(params);
    const body = await request.json();
    const { insurance_company_id } = addHospitalInsuranceCompanySchema.parse(body);
    const mapping = await addHospitalInsuranceCompany(hospitalId, insurance_company_id);

    return NextResponse.json({ success: true, mapping }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function reorderHospitalInsuranceCompaniesHandler(request: NextRequest, params: { hospitalId: string }) {
  try {
    await requirePermission("hospitals", "update");
    const { hospitalId } = hospitalInsuranceHospitalIdParamSchema.parse(params);
    const body = await request.json();
    const { order } = reorderHospitalInsuranceCompaniesSchema.parse(body);
    const mappings = await reorderHospitalInsuranceCompanies(hospitalId, order);

    return NextResponse.json({ success: true, mappings });
  } catch (error) {
    return handleError(error);
  }
}

export async function removeHospitalInsuranceCompanyHandler(params: { hospitalId: string; insuranceCompanyId: string }) {
  try {
    await requirePermission("hospitals", "update");
    const { hospitalId, insuranceCompanyId } = hospitalInsuranceIdParamSchema.parse(params);
    await removeHospitalInsuranceCompany(hospitalId, insuranceCompanyId);

    return NextResponse.json({ success: true, message: "Insurance company removed from hospital" });
  } catch (error) {
    return handleError(error);
  }
}
