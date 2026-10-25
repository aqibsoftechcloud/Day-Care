export type UserStatus = "active" | "inactive";

/** Mirrors services/user.service.ts's toSafeUser() output — password is never present (Prisma `omit: { password: true }`), and the numeric id is only ever exposed pre-encrypted as `user_id`. */
export type User = {
  user_id: string;
  name: string;
  email: string;
  role_id: number;
  status: UserStatus;
  created_at: string;
  updated_at: string;
};

/** Mirrors validators/user.validator.ts's createUserSchema exactly. */
export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role_id: number;
  status?: UserStatus;
};

/** Mirrors updateUserSchema (createUserSchema.partial()) — every field, including password, is optional on update. */
export type UpdateUserInput = Partial<CreateUserInput>;
