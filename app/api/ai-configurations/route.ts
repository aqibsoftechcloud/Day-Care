import { NextRequest } from "next/server";
import {
  createAIConfigurationHandler,
  listAIConfigurationsHandler,
} from "@/controllers/ai-configuration.controller";

export async function GET(request: NextRequest) {
  return listAIConfigurationsHandler(request);
}

export async function POST(request: NextRequest) {
  return createAIConfigurationHandler(request);
}
