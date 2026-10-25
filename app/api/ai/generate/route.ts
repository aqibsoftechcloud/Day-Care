import { NextRequest } from "next/server";
import { generateContentHandler } from "@/controllers/ai-generation.controller";

export async function POST(request: NextRequest) {
  return generateContentHandler(request);
}
