import { NextRequest } from "next/server";
import {
  createBannerHandler,
  listBanners,
} from "@/controllers/banner.controller";

export async function GET() {
  return listBanners();
}

export async function POST(request: NextRequest) {
  return createBannerHandler(request);
}
