import { NextRequest } from "next/server";
import { loginHandler } from "@/controllers/auth.controller";

export async function POST(request: NextRequest) {
  return loginHandler(request);
}
