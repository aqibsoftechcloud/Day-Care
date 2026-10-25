/** Mirrors the exact shape returned by services/role.service.ts — a raw `roles` row, no select/omit applied. */
export type Role = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/role.validator.ts's createRoleSchema. */
export type CreateRoleInput = {
  name: string;
  description?: string | null;
  status?: "active" | "inactive";
};

export type UpdateRoleInput = Partial<CreateRoleInput>;
