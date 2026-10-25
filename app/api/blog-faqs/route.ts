import { NextRequest } from "next/server";
import {
  createBlogFaqHandler,
  listBlogFaqsHandler,
} from "@/controllers/blog-faq.controller";

export async function GET(request: NextRequest) {
  return listBlogFaqsHandler(request);
}

export async function POST(request: NextRequest) {
  return createBlogFaqHandler(request);
}
