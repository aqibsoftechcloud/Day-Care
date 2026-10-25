import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  requirePermission,
  tryHandleAuthorizationError,
} from "@/lib/auth/authorization";
import { ovulationCalculatorIdParamSchema } from "@/validators/ovulation-calculator.validator";
import {
  getOvulationCalculatorSubmissionById,
  getOvulationCalculatorSubmissions,
  OvulationCalculatorSubmissionNotFoundError,
} from "@/services/ovulation-calculator.service";

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

  if (error instanceof OvulationCalculatorSubmissionNotFoundError) {
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

export async function listOvulationCalculatorSubmissionsHandler() {
  try {
    await requirePermission("submissions", "view");
    const submissions = await getOvulationCalculatorSubmissions();

    return NextResponse.json({ success: true, submissions });
  } catch (error) {
    return handleError(error);
  }
}

export async function getOvulationCalculatorSubmissionHandler(params: {
  id: string;
}) {
  try {
    await requirePermission("submissions", "view");
    const { id } = ovulationCalculatorIdParamSchema.parse(params);
    const submission = await getOvulationCalculatorSubmissionById(id);

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    return handleError(error);
  }
}
