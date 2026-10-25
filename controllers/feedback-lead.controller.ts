import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  feedbackLeadIdParamSchema,
  listFeedbackLeadsQuerySchema,
  updateFeedbackLeadSchema,
} from "@/validators/feedback-lead.validator";
import {
  deleteFeedbackLead,
  FeedbackLeadNotFoundError,
  getFeedbackLeadById,
  getFeedbackLeads,
  updateFeedbackLead,
} from "@/services/feedback-lead.service";

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

  if (error instanceof FeedbackLeadNotFoundError) {
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

export async function listFeedbackLeadsHandler(request: NextRequest) {
  try {
    await requirePermission("feedback-leads", "view");
    const query = listFeedbackLeadsQuerySchema.parse({
      email: request.nextUrl.searchParams.get("email") ?? undefined,
    });

    const feedbackLeads = await getFeedbackLeads(query);

    return NextResponse.json({ success: true, feedbackLeads });
  } catch (error) {
    return handleError(error);
  }
}

export async function getFeedbackLeadHandler(params: { id: string }) {
  try {
    await requirePermission("feedback-leads", "view");
    const { id } = feedbackLeadIdParamSchema.parse(params);
    const feedbackLead = await getFeedbackLeadById(id);

    return NextResponse.json({ success: true, feedbackLead });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateFeedbackLeadHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("feedback-leads", "update");
    const { id } = feedbackLeadIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateFeedbackLeadSchema.parse(body);
    const feedbackLead = await updateFeedbackLead(id, data);

    return NextResponse.json({ success: true, feedbackLead });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteFeedbackLeadHandler(params: { id: string }) {
  try {
    await requirePermission("feedback-leads", "delete");
    const { id } = feedbackLeadIdParamSchema.parse(params);
    await deleteFeedbackLead(id);

    return NextResponse.json({
      success: true,
      message: "Feedback lead deleted",
    });
  } catch (error) {
    return handleError(error);
  }
}
