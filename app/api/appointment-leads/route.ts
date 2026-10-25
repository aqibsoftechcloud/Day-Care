import { NextRequest } from "next/server";
import {
  createAppointmentLeadHandler,
  listAppointmentLeadsHandler,
} from "@/controllers/appointment-lead.controller";

export async function GET(request: NextRequest) {
  return listAppointmentLeadsHandler(request);
}

export async function POST(request: NextRequest) {
  return createAppointmentLeadHandler(request);
}
