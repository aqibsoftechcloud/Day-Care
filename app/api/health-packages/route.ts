import { NextRequest } from "next/server";
import {
  createHealthPackageHandler,
  listHealthPackagesHandler,
} from "@/controllers/health-package.controller";

export async function GET(request: NextRequest) {
  return listHealthPackagesHandler(request);
}

export async function POST(request: NextRequest) {
  return createHealthPackageHandler(request);
}
