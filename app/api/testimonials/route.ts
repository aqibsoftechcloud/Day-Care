import { NextRequest } from "next/server";
import {
  createTestimonialHandler,
  listTestimonialsHandler,
} from "@/controllers/testimonial.controller";

export async function GET(request: NextRequest) {
  return listTestimonialsHandler(request);
}

export async function POST(request: NextRequest) {
  return createTestimonialHandler(request);
}
