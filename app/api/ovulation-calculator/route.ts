import { listOvulationCalculatorSubmissionsHandler } from "@/controllers/ovulation-calculator.controller";

// Read-only module: only GET is exported. Next.js's App Router
// automatically returns 405 Method Not Allowed for any other HTTP
// method sent to this route.
export async function GET() {
  return listOvulationCalculatorSubmissionsHandler();
}
