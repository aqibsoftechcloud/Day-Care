import { NextRequest } from "next/server";
import { createRoleHandler, listRoles } from "@/controllers/role.controller";

export async function GET() {
  return listRoles();
}

export async function POST(request: NextRequest) {
  return createRoleHandler(request);
}
