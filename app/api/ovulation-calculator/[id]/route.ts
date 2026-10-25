import { NextRequest } from "next/server";
import { getOvulationCalculatorSubmissionHandler } from "@/controllers/ovulation-calculator.controller";

type RouteParams = { params: Promise<{ id: string }> };

// Read-only module: only GET is exported. Next.js's App Router
// automatically returns 405 Method Not Allowed for any other HTTP
// method sent to this route.
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getOvulationCalculatorSubmissionHandler(resolvedParams);
}
