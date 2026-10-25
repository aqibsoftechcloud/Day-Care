import { NextRequest } from "next/server";
import { createPageHandler, listPages } from "@/controllers/page.controller";

export async function GET(request: NextRequest) {
  return listPages(request);
}

export async function POST(request: NextRequest) {
  return createPageHandler(request);
}
