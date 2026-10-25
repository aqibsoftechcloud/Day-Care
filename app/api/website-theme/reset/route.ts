import { resetWebsiteThemeHandler } from "@/controllers/website-theme.controller";

export async function POST() {
  return resetWebsiteThemeHandler();
}
