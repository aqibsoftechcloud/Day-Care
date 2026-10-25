import { NextRequest } from "next/server";
import {
  deleteTestimonialHandler,
  getTestimonialHandler,
  updateTestimonialHandler,
} from "@/controllers/testimonial.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return getTestimonialHandler(resolvedParams);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return updateTestimonialHandler(request, resolvedParams);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteTestimonialHandler(resolvedParams);
}
