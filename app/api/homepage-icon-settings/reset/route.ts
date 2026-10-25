import { resetGlobalHomepageIconsHandler } from "@/controllers/homepage-icon-settings.controller";

export async function POST() {
  return resetGlobalHomepageIconsHandler();
}
