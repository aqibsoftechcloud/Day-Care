import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  MulterError,
  parseMultipartFields,
  UnsupportedFileTypeError,
} from "@/lib/upload";
import {
  createInsuranceCompanySchema,
  insuranceCompanyIdParamSchema,
  listInsuranceCompaniesQuerySchema,
  updateInsuranceCompanySchema,
} from "@/validators/insurance-company.validator";
import {
  createInsuranceCompany,
  deleteInsuranceCompany,
  getInsuranceCompanies,
  getInsuranceCompanyById,
  InsuranceCompanyImageInput,
  InsuranceCompanyInUseError,
  InsuranceCompanyNotFoundError,
  updateInsuranceCompany,
} from "@/services/insurance-company.service";

const LOGO_UPLOAD_FIELDS = [{ name: "logo", maxCount: 1 }];

function toImageInput(files: Record<string, Express.Multer.File[]>): InsuranceCompanyImageInput | undefined {
  const file = files.logo?.[0];

  if (!file) {
    return undefined;
  }

  return { buffer: file.buffer, mimeType: file.mimetype };
}

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

  if (error instanceof UnsupportedFileTypeError || error instanceof InsuranceCompanyInUseError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  if (error instanceof MulterError) {
    return NextResponse.json({ success: false, message: `Upload error: ${error.message}` }, { status: 400 });
  }

  if (error instanceof InsuranceCompanyNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json(
      { success: false, message: "An insurance company with this name or SEO URL already exists" },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function listInsuranceCompaniesHandler(request: NextRequest) {
  try {
    await requirePermission("insurance-companies", "view");
    const params = request.nextUrl.searchParams;
    const query = listInsuranceCompaniesQuerySchema.parse({
      status: params.get("status") ?? undefined,
      search: params.get("search") ?? undefined,
    });

    const insuranceCompanies = await getInsuranceCompanies(query);

    return NextResponse.json({ success: true, insuranceCompanies });
  } catch (error) {
    return handleError(error);
  }
}

export async function createInsuranceCompanyHandler(request: NextRequest) {
  try {
    await requirePermission("insurance-companies", "create");
    const { fields, files } = await parseMultipartFields(request, LOGO_UPLOAD_FIELDS);
    const data = createInsuranceCompanySchema.parse(fields);
    const image = toImageInput(files);

    const insuranceCompany = await createInsuranceCompany(data, image);

    return NextResponse.json({ success: true, insuranceCompany }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getInsuranceCompanyHandler(params: { id: string }) {
  try {
    await requirePermission("insurance-companies", "view");
    const { id } = insuranceCompanyIdParamSchema.parse(params);
    const insuranceCompany = await getInsuranceCompanyById(id);

    return NextResponse.json({ success: true, insuranceCompany });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateInsuranceCompanyHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("insurance-companies", "update");
    const { id } = insuranceCompanyIdParamSchema.parse(params);
    const { fields, files } = await parseMultipartFields(request, LOGO_UPLOAD_FIELDS);
    const data = updateInsuranceCompanySchema.parse(fields);
    const image = toImageInput(files);

    const insuranceCompany = await updateInsuranceCompany(id, data, image);

    return NextResponse.json({ success: true, insuranceCompany });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteInsuranceCompanyHandler(params: { id: string }) {
  try {
    await requirePermission("insurance-companies", "delete");
    const { id } = insuranceCompanyIdParamSchema.parse(params);
    await deleteInsuranceCompany(id);

    return NextResponse.json({ success: true, message: "Insurance company deleted" });
  } catch (error) {
    return handleError(error);
  }
}
