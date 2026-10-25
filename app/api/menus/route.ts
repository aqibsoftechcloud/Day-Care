import { NextRequest } from "next/server";
import { createMenuHandler, listMenus } from "@/controllers/menu.controller";

export async function GET(request: NextRequest) {
  return listMenus(request);
}

export async function POST(request: NextRequest) {
  return createMenuHandler(request);
}
