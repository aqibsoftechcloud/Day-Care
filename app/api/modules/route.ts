import { NextRequest } from "next/server";
import {
  createModuleHandler,
  listModules,
} from "@/controllers/module.controller";

export async function GET() {
  return listModules();
}

export async function POST(request: NextRequest) {
  return createModuleHandler(request);
}
