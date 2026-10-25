import { NextRequest } from "next/server";
import {
  createPermissionHandler,
  listPermissions,
} from "@/controllers/permission.controller";

export async function GET() {
  return listPermissions();
}

export async function POST(request: NextRequest) {
  return createPermissionHandler(request);
}
