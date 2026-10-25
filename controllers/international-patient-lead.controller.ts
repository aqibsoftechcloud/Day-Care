import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  internationalPatientLeadIdParamSchema,
  listInternationalPatientLeadsQuerySchema,
  updateInternationalPatientLeadSchema,
} from "@/validators/international-patient-lead.validator";
import {
  deleteInternationalPatientLead,
  getInternationalPatientLeadById,
  getInternationalPatientLeads,
  InternationalPatientLeadNotFoundError,
  updateInternationalPatientLead,
} from "@/services/international-patient-lead.service";

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

  if (error instanceof InternationalPatientLeadNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function listInternationalPatientLeadsHandler(
  request: NextRequest
) {
  try {
    await requirePermission("international-patients-leads", "view");
    const query = listInternationalPatientLeadsQuerySchema.parse({
      country: request.nextUrl.searchParams.get("country") ?? undefined,
    });

    const internationalPatientLeads = await getInternationalPatientLeads(
      query
    );

    return NextResponse.json({
      success: true,
      internationalPatientLeads,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function getInternationalPatientLeadHandler(params: {
  id: string;
}) {
  try {
    await requirePermission("international-patients-leads", "view");
    const { id } = internationalPatientLeadIdParamSchema.parse(params);
    const internationalPatientLead = await getInternationalPatientLeadById(
      id
    );

    return NextResponse.json({
      success: true,
      internationalPatientLead,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteInternationalPatientLeadHandler(params: {
  id: string;
}) {
  try {
    await requirePermission("international-patients-leads", "delete");
    const { id } = internationalPatientLeadIdParamSchema.parse(params);
    await deleteInternationalPatientLead(id);

    return NextResponse.json({
      success: true,
      message: "International patient lead deleted",
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateInternationalPatientLeadHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("international-patients-leads", "update");
    const { id } = internationalPatientLeadIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateInternationalPatientLeadSchema.parse(body);
    const internationalPatientLead = await updateInternationalPatientLead(
      id,
      data
    );

    return NextResponse.json({
      success: true,
      internationalPatientLead,
    });
  } catch (error) {
    return handleError(error);
  }
}
