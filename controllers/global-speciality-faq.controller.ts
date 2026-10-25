import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createGlobalSpecialityFaqSchema,
  globalSpecialityFaqIdParamSchema,
  listGlobalSpecialityFaqsQuerySchema,
  updateGlobalSpecialityFaqSchema,
} from "@/validators/global-speciality-faq.validator";
import {
  createGlobalSpecialityFaq,
  deleteGlobalSpecialityFaq,
  getGlobalSpecialityFaqById,
  getGlobalSpecialityFaqs,
  GlobalSpecialityFaqNotFoundError,
  GlobalSpecialityNotFoundError,
  updateGlobalSpecialityFaq,
} from "@/services/global-speciality-faq.service";

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

  if (error instanceof GlobalSpecialityFaqNotFoundError || error instanceof GlobalSpecialityNotFoundError) {
    return NextResponse.json({ success: false, message: error.message }, { status: 404 });
  }

  console.error(error);

  return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
}

export async function listGlobalSpecialityFaqsHandler(request: NextRequest) {
  try {
    await requirePermission("global-specialities", "view");
    const params = request.nextUrl.searchParams;
    const query = listGlobalSpecialityFaqsQuerySchema.parse({
      global_speciality_id: params.get("global_speciality_id") ?? undefined,
      status: params.get("status") ?? undefined,
    });

    const globalSpecialityFaqs = await getGlobalSpecialityFaqs(query);

    return NextResponse.json({ success: true, globalSpecialityFaqs });
  } catch (error) {
    return handleError(error);
  }
}

export async function createGlobalSpecialityFaqHandler(request: NextRequest) {
  try {
    await requirePermission("global-specialities", "update");
    const body = await request.json();
    const data = createGlobalSpecialityFaqSchema.parse(body);
    const globalSpecialityFaq = await createGlobalSpecialityFaq(data);

    return NextResponse.json({ success: true, globalSpecialityFaq }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getGlobalSpecialityFaqHandler(params: { id: string }) {
  try {
    await requirePermission("global-specialities", "view");
    const { id } = globalSpecialityFaqIdParamSchema.parse(params);
    const globalSpecialityFaq = await getGlobalSpecialityFaqById(id);

    return NextResponse.json({ success: true, globalSpecialityFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateGlobalSpecialityFaqHandler(request: NextRequest, params: { id: string }) {
  try {
    await requirePermission("global-specialities", "update");
    const { id } = globalSpecialityFaqIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateGlobalSpecialityFaqSchema.parse(body);
    const globalSpecialityFaq = await updateGlobalSpecialityFaq(id, data);

    return NextResponse.json({ success: true, globalSpecialityFaq });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteGlobalSpecialityFaqHandler(params: { id: string }) {
  try {
    await requirePermission("global-specialities", "update");
    const { id } = globalSpecialityFaqIdParamSchema.parse(params);
    await deleteGlobalSpecialityFaq(id);

    return NextResponse.json({ success: true, message: "Global speciality FAQ deactivated" });
  } catch (error) {
    return handleError(error);
  }
}
