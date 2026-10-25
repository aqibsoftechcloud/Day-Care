import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  createLocationSchema,
  locationIdParamSchema,
  updateLocationSchema,
} from "@/validators/location.validator";
import {
  CityNotFoundError,
  createLocation,
  deleteLocation,
  getLocationById,
  getLocations,
  LocationNotFoundError,
  updateLocation,
} from "@/services/location.service";

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

  if (error instanceof LocationNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof CityNotFoundError) {
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
        message: "A location with this SEO URL already exists",
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

export async function listLocations() {
  try {
    await requirePermission("locations", "view");
    const locations = await getLocations();
    return NextResponse.json({ success: true, locations });
  } catch (error) {
    return handleError(error);
  }
}

export async function createLocationHandler(request: NextRequest) {
  try {
    await requirePermission("locations", "create");
    const body = await request.json();
    const data = createLocationSchema.parse(body);
    const location = await createLocation(data);

    return NextResponse.json({ success: true, location }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getLocationHandler(params: { id: string }) {
  try {
    await requirePermission("locations", "view");
    const { id } = locationIdParamSchema.parse(params);
    const location = await getLocationById(id);

    return NextResponse.json({ success: true, location });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateLocationHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("locations", "update");
    const { id } = locationIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateLocationSchema.parse(body);
    const location = await updateLocation(id, data);

    return NextResponse.json({ success: true, location });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteLocationHandler(params: { id: string }) {
  try {
    await requirePermission("locations", "delete");
    const { id } = locationIdParamSchema.parse(params);
    await deleteLocation(id);

    return NextResponse.json({
      success: true,
      message: "Location deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
