import { prisma } from "@/lib/prisma";
import type {
  ListBookaformDataQuery,
  UpdateBookaformDataInput,
} from "@/validators/bookaform.validator";

export class BookaformDataNotFoundError extends Error {
  constructor(id: number) {
    super(`Book-a-form data with id ${id} not found`);
    this.name = "BookaformDataNotFoundError";
  }
}

const bookaformDataSelect = {
  id: true,
  data_from: true,
  status: true,
  created_at: true,
  updated_at: true,
} as const;

export async function getBookaformData(filter?: ListBookaformDataQuery) {
  return prisma.bookaform_data.findMany({
    where: {
      ...(filter?.status !== undefined ? { status: filter.status } : {}),
    },
    select: bookaformDataSelect,
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });
}

export async function getBookaformDataById(id: number) {
  const record = await prisma.bookaform_data.findUnique({
    where: { id },
    select: bookaformDataSelect,
  });

  if (!record) {
    throw new BookaformDataNotFoundError(id);
  }

  return record;
}

export async function updateBookaformData(
  id: number,
  data: UpdateBookaformDataInput
) {
  await getBookaformDataById(id);

  return prisma.bookaform_data.update({
    where: { id },
    data: { ...data, updated_at: new Date() },
    select: bookaformDataSelect,
  });
}

/**
 * Soft delete: reuses the existing `status` column exactly like every
 * other soft-delete in this app (languages/roles/users/etc.) — sets it to
 * "inactive" rather than adding a new mechanism. The row is never
 * physically removed.
 */
export async function deleteBookaformData(id: number) {
  await getBookaformDataById(id);

  await prisma.bookaform_data.update({
    where: { id },
    data: { status: "inactive", updated_at: new Date() },
  });
}
