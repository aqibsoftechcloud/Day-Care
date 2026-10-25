import { NextRequest } from "next/server";
import { createBlogHandler, listBlogsHandler } from "@/controllers/blog.controller";

export async function GET(request: NextRequest) {
  return listBlogsHandler(request);
}

export async function POST(request: NextRequest) {
  return createBlogHandler(request);
}
