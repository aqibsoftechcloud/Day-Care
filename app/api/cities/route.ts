import { NextRequest } from "next/server";
import {
  createCityHandler,
  listCities,
} from "@/controllers/city.controller";

export async function GET() {
  return listCities();
}

export async function POST(request: NextRequest) {
  return createCityHandler(request);
}
