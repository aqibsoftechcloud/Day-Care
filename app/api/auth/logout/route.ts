import { logoutHandler } from "@/controllers/auth.controller";

export async function POST() {
  return logoutHandler();
}
