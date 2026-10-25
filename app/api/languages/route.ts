import { NextRequest } from "next/server";
import {
  createLanguageHandler,
  listLanguages,
} from "@/controllers/language.controller";

export async function GET() {
  return listLanguages();
}

export async function POST(request: NextRequest) {
  return createLanguageHandler(request);
}
