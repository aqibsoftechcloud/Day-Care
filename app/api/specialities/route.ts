import { NextRequest } from "next/server";
import {
  createSpecialityHandler,
  listSpecialitiesHandler,
} from "@/controllers/speciality.controller";

export async function GET(request: NextRequest) {
  return listSpecialitiesHandler(request);
}

export async function POST(request: NextRequest) {
  return createSpecialityHandler(request);
}
