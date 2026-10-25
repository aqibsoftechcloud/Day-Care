import { NextRequest } from "next/server";
import {
  createHomepageCustomIconHandler,
  listHomepageCustomIconsHandler,
} from "@/controllers/homepage-custom-icon.controller";

export async function GET() {
  return listHomepageCustomIconsHandler();
}

export async function POST(request: NextRequest) {
  return createHomepageCustomIconHandler(request);
}
