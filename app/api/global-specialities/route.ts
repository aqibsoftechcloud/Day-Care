import { NextRequest } from "next/server";
import {
  createGlobalSpecialityHandler,
  listGlobalSpecialitiesHandler,
} from "@/controllers/global-speciality.controller";

export async function GET(request: NextRequest) {
  return listGlobalSpecialitiesHandler(request);
}

export async function POST(request: NextRequest) {
  return createGlobalSpecialityHandler(request);
}
