import { NextRequest } from "next/server";
import {
  createLocationHandler,
  listLocations,
} from "@/controllers/location.controller";

export async function GET() {
  return listLocations();
}

export async function POST(request: NextRequest) {
  return createLocationHandler(request);
}
