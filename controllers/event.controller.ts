import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createEventSchema,
  eventIdParamSchema,
  listEventsQuerySchema,
  updateEventSchema,
} from "@/validators/event.validator";
import {
  createEvent,
  deleteEvent,
  EventNotFoundError,
  getEventById,
  getEvents,
  updateEvent,
} from "@/services/event.service";

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

  if (error instanceof EventNotFoundError) {
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

export async function listEventsHandler(request: NextRequest) {
  try {
    await requirePermission("events-and-calendar", "view");
    const query = listEventsQuerySchema.parse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });

    const events = await getEvents(query);

    return NextResponse.json({ success: true, events });
  } catch (error) {
    return handleError(error);
  }
}

export async function createEventHandler(request: NextRequest) {
  try {
    await requirePermission("events-and-calendar", "create");
    const body = await request.json();
    const data = createEventSchema.parse(body);
    const event = await createEvent(data);

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getEventHandler(params: { id: string }) {
  try {
    await requirePermission("events-and-calendar", "view");
    const { id } = eventIdParamSchema.parse(params);
    const event = await getEventById(id);

    return NextResponse.json({ success: true, event });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateEventHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("events-and-calendar", "update");
    const { id } = eventIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateEventSchema.parse(body);
    const event = await updateEvent(id, data);

    return NextResponse.json({ success: true, event });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteEventHandler(params: { id: string }) {
  try {
    await requirePermission("events-and-calendar", "delete");
    const { id } = eventIdParamSchema.parse(params);
    await deleteEvent(id);

    return NextResponse.json({
      success: true,
      message: "Event deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
