import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getClientIp } from "@/lib/rate-limit";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  appointmentLeadIdParamSchema,
  listAppointmentLeadsQuerySchema,
  updateAppointmentLeadSchema,
} from "@/validators/appointment-lead.validator";
import {
  AppointmentLeadNotFoundError,
  deleteAppointmentLead,
  getAppointmentLeadById,
  getAppointmentLeads,
  updateAppointmentLead,
} from "@/services/appointment-lead.service";
import { MAX_LEAD_BODY_BYTES, submitConsultationLead } from "@/services/consultation-lead.service";

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

  if (error instanceof AppointmentLeadNotFoundError) {
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

/**
 * Public endpoint — a visitor's consultation request. Deliberately has no
 * `requirePermission` call: there is no session to authorize. The body is a
 * flat object keyed by the configured form field keys (e.g. full_name,
 * phone, phone__cc, treatment, city); it is validated against the saved
 * form configuration by the same service the page form's Server Action
 * uses. Field errors come back as `errors: { [fieldKey]: [message] }`.
 */
export async function createAppointmentLeadHandler(request: NextRequest) {
  try {
    let body: unknown;
    try {
      const declared = Number(request.headers.get("content-length") ?? 0);
      if (declared > MAX_LEAD_BODY_BYTES) {
        return NextResponse.json({ success: false, message: "Request body too large" }, { status: 413 });
      }

      const text = await request.text();
      if (text.length > MAX_LEAD_BODY_BYTES) {
        return NextResponse.json({ success: false, message: "Request body too large" }, { status: 413 });
      }

      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ success: false, message: "Request body must be valid JSON" }, { status: 400 });
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ success: false, message: "Request body must be an object" }, { status: 400 });
    }

    const result = await submitConsultationLead(body as Record<string, unknown>, { clientIp: getClientIp(request.headers) });

    if (!result.ok && result.rateLimitedForSeconds) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 429, headers: { "Retry-After": String(result.rateLimitedForSeconds) } }
      );
    }

    if (!result.ok) {
      const errors = Object.fromEntries(Object.entries(result.errors).map(([key, message]) => [key, [message]]));
      return NextResponse.json({ success: false, message: result.message, errors }, { status: 400 });
    }

    return NextResponse.json({ success: true, duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function listAppointmentLeadsHandler(request: NextRequest) {
  try {
    await requirePermission("book-an-appointment", "view");
    const query = listAppointmentLeadsQuerySchema.parse({
      email: request.nextUrl.searchParams.get("email") ?? undefined,
    });

    const appointmentLeads = await getAppointmentLeads(query);

    return NextResponse.json({ success: true, appointmentLeads });
  } catch (error) {
    return handleError(error);
  }
}

export async function getAppointmentLeadHandler(params: { id: string }) {
  try {
    await requirePermission("book-an-appointment", "view");
    const { id } = appointmentLeadIdParamSchema.parse(params);
    const appointmentLead = await getAppointmentLeadById(id);

    return NextResponse.json({ success: true, appointmentLead });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateAppointmentLeadHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("book-an-appointment", "update");
    const { id } = appointmentLeadIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateAppointmentLeadSchema.parse(body);
    const appointmentLead = await updateAppointmentLead(id, data);

    return NextResponse.json({ success: true, appointmentLead });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteAppointmentLeadHandler(params: { id: string }) {
  try {
    await requirePermission("book-an-appointment", "delete");
    const { id } = appointmentLeadIdParamSchema.parse(params);
    await deleteAppointmentLead(id);

    return NextResponse.json({
      success: true,
      message: "Appointment lead deleted",
    });
  } catch (error) {
    return handleError(error);
  }
}
