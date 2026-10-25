import { NextRequest } from "next/server";
import {
  createGeneralFaqHandler,
  listGeneralFaqsHandler,
} from "@/controllers/general-faq.controller";

export async function GET(request: NextRequest) {
  return listGeneralFaqsHandler(request);
}

export async function POST(request: NextRequest) {
  return createGeneralFaqHandler(request);
}
