import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createGlobalTreatmentFaqSchema,
  globalTreatmentFaqIdParamSchema,
  listGlobalTreatmentFaqsQuerySchema,
  updateGlobalTreatmentFaqSchema,
} from "@/validators/global-treatment-faq.validator";
import {
  createGlobalTreatmentFaq,
  deleteGlobalTreatmentFaq,
  getGlobalTreatmentFaqById,
  getGlobalTreatmentFaqs,
  GlobalTreatmentFaqNotFoundError,
  GlobalTreatmentNotFoundError,
  updateGlobalTreatmentFaq,
} from "@/services/global-treatment-faq.service";

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

  if (error instanceof GlobalTreatmentFaqNotFoundError || error instanceof GlobalTreatmentNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function listGlobalTreatmentFaqsHandler(request: NextRequest) {
  try {
    await requirePermission("global-treatments", "view");
    const params = request.nextUrl.searchParams;
    const query = listGlobalTreatmentFaqsQuerySchema.parse({
      global_treatment_id: params.get("global_treatment_id") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const globalTreatmentFaqs = await getGlobalTreatmentFaqs(query);

    return NextResponse.json({ success: true, globalTreatmentFaqs });
  } catch (error) {
    return handleError(error);
  }
}

export async function createGlobalTreatmentFaqHandler(request: NextRequest) {
  try {
    await requirePermission("global-treatments", "update");
    const body = await request.json();
    const data = createGlobalTreatmentFaqSchema.parse(body);
    const globalTreatmentFaq = await createGlobalTreatmentFaq(data);

    return NextResponse.json({ success: true, globalTreatmentFaq }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getGlobalTreatmentFaqHandler(params: { id: string }) {
  try {
    await requirePermission("global-treatments", "view");
    const { id } = globalTreatmentFaqIdParamSchema.parse(params);
    const globalTreatmentFaq = await getGlobalTreatmentFaqById(id);

    return NextResponse.json({ success: true, globalTreatmentFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateGlobalTreatmentFaqHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("global-treatments", "update");
    const { id } = globalTreatmentFaqIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateGlobalTreatmentFaqSchema.parse(body);
    const globalTreatmentFaq = await updateGlobalTreatmentFaq(id, data);

    return NextResponse.json({ success: true, globalTreatmentFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteGlobalTreatmentFaqHandler(params: { id: string }) {
  try {
    await requirePermission("global-treatments", "update");
    const { id } = globalTreatmentFaqIdParamSchema.parse(params);
    await deleteGlobalTreatmentFaq(id);

    return NextResponse.json({ success: true, message: "Global treatment FAQ deactivated" });
  } catch (error) {
    return handleError(error);
  }
}
