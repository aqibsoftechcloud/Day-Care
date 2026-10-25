import { meHandler } from "@/controllers/auth.controller";

export async function GET() {
  return meHandler();
}
