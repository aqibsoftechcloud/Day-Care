import { NextRequest } from "next/server";
import { listBookaformDataHandler } from "@/controllers/bookaform.controller";

export async function GET(request: NextRequest) {
  return listBookaformDataHandler(request);
}
