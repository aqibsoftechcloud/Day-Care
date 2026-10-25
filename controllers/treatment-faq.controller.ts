import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createTreatmentFaqSchema,
  listTreatmentFaqsQuerySchema,
  treatmentFaqIdParamSchema,
  updateTreatmentFaqSchema,
} from "@/validators/treatment-faq.validator";
import {
  createTreatmentFaq,
  deleteTreatmentFaq,
  getTreatmentFaqById,
  getTreatmentFaqs,
  TreatmentFaqNotFoundError,
  TreatmentNotFoundError,
  updateTreatmentFaq,
} from "@/services/treatment-faq.service";

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

  if (error instanceof TreatmentFaqNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof TreatmentNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return NextResponse.json(
      {
        success: false,
        message: "A conflicting treatment FAQ record already exists",
      },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function listTreatmentFaqsHandler(request: NextRequest) {
  try {
    await requirePermission("treatments", "view");
    const params = request.nextUrl.searchParams;
    const query = listTreatmentFaqsQuerySchema.parse({
      treatment_id: params.get("treatment_id") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const treatmentFaqs = await getTreatmentFaqs(query);

    return NextResponse.json({ success: true, treatmentFaqs });
  } catch (error) {
    return handleError(error);
  }
}

export async function createTreatmentFaqHandler(request: NextRequest) {
  try {
    await requirePermission("treatments", "create");
    const body = await request.json();
    const data = createTreatmentFaqSchema.parse(body);
    const treatmentFaq = await createTreatmentFaq(data);

    return NextResponse.json(
      { success: true, treatmentFaq },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function getTreatmentFaqHandler(params: { id: string }) {
  try {
    await requirePermission("treatments", "view");
    const { id } = treatmentFaqIdParamSchema.parse(params);
    const treatmentFaq = await getTreatmentFaqById(id);

    return NextResponse.json({ success: true, treatmentFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateTreatmentFaqHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("treatments", "update");
    const { id } = treatmentFaqIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateTreatmentFaqSchema.parse(body);
    const treatmentFaq = await updateTreatmentFaq(id, data);

    return NextResponse.json({ success: true, treatmentFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteTreatmentFaqHandler(params: { id: string }) {
  try {
    await requirePermission("treatments", "delete");
    const { id } = treatmentFaqIdParamSchema.parse(params);
    await deleteTreatmentFaq(id);

    return NextResponse.json({
      success: true,
      message: "Treatment FAQ deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
