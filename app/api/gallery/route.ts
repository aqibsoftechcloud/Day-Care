import { NextRequest } from "next/server";
import {
  createGalleryHandler,
  listGalleryHandler,
} from "@/controllers/gallery.controller";

export async function GET(request: NextRequest) {
  return listGalleryHandler(request);
}

export async function POST(request: NextRequest) {
  return createGalleryHandler(request);
}
