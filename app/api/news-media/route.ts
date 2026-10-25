import { NextRequest } from "next/server";
import {
  createNewsMediaHandler,
  listNewsMediaHandler,
} from "@/controllers/news-media.controller";

export async function GET(request: NextRequest) {
  return listNewsMediaHandler(request);
}

export async function POST(request: NextRequest) {
  return createNewsMediaHandler(request);
}
