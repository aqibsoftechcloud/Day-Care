import { NextRequest } from "next/server";
import {
  createJsConfigurationHandler,
  listJsConfigurationsHandler,
} from "@/controllers/js-configuration.controller";

export async function GET(request: NextRequest) {
  return listJsConfigurationsHandler(request);
}

export async function POST(request: NextRequest) {
  return createJsConfigurationHandler(request);
}
