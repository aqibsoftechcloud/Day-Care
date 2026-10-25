import { NextRequest } from "next/server";
import { createUserHandler, listUsers } from "@/controllers/user.controller";

export async function GET() {
  return listUsers();
}

export async function POST(request: NextRequest) {
  return createUserHandler(request);
}
