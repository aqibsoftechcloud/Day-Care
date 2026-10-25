import { NextRequest } from "next/server";
import { createEventHandler, listEventsHandler } from "@/controllers/event.controller";

export async function GET(request: NextRequest) {
  return listEventsHandler(request);
}

export async function POST(request: NextRequest) {
  return createEventHandler(request);
}
