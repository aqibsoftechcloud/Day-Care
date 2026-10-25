import { deleteHomepageCustomIconHandler } from "@/controllers/homepage-custom-icon.controller";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  return deleteHomepageCustomIconHandler(resolvedParams);
}
