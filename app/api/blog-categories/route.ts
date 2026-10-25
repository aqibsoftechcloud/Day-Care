import { NextRequest } from "next/server";
import {
  createBlogCategoryHandler,
  listBlogCategoriesHandler,
} from "@/controllers/blog-category.controller";

export async function GET(request: NextRequest) {
  return listBlogCategoriesHandler(request);
}

export async function POST(request: NextRequest) {
  return createBlogCategoryHandler(request);
}
