import { NextRequest } from "next/server";
import {
  createActionHandler,
  listActions,
} from "@/controllers/action.controller";

export async function GET() {
  return listActions();
}

export async function POST(request: NextRequest) {
  return createActionHandler(request);
}
