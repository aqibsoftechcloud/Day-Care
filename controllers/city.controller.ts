import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import {
  cityIdParamSchema,
  createCitySchema,
  updateCitySchema,
} from "@/validators/city.validator";
import {
  CityNotFoundError,
  createCity,
  deleteCity,
  getCities,
  getCityById,
  LanguageNotFoundError,
  updateCity,
} from "@/services/city.service";

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

  if (error instanceof CityNotFoundError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 404 }
    );
  }

  if (error instanceof LanguageNotFoundError) {
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
      { success: false, message: "A city with this SEO URL already exists" },
      { status: 409 }
    );
  }

  console.error(error);

  return NextResponse.json(
    { success: false, message: "Internal server error" },
    { status: 500 }
  );
}

export async function listCities() {
  try {
    await requirePermission("cities", "view");
    const cities = await getCities();
    return NextResponse.json({ success: true, cities });
  } catch (error) {
    return handleError(error);
  }
}

export async function createCityHandler(request: NextRequest) {
  try {
    await requirePermission("cities", "create");
    const body = await request.json();
    const data = createCitySchema.parse(body);
    const city = await createCity(data);

    return NextResponse.json({ success: true, city }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function getCityHandler(params: { id: string }) {
  try {
    await requirePermission("cities", "view");
    const { id } = cityIdParamSchema.parse(params);
    const city = await getCityById(id);

    return NextResponse.json({ success: true, city });
  } catch (error) {
    return handleError(error);
  }
}

export async function updateCityHandler(
  request: NextRequest,
  params: { id: string }
) {
  try {
    await requirePermission("cities", "update");
    const { id } = cityIdParamSchema.parse(params);
    const body = await request.json();
    const data = updateCitySchema.parse(body);
    const city = await updateCity(id, data);

    return NextResponse.json({ success: true, city });
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteCityHandler(params: { id: string }) {
  try {
    await requirePermission("cities", "delete");
    const { id } = cityIdParamSchema.parse(params);
    await deleteCity(id);

    return NextResponse.json({
      success: true,
      message: "City deactivated",
    });
  } catch (error) {
    return handleError(error);
  }
}
