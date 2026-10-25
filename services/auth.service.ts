import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { LoginInput } from "@/validators/auth.validator";

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

export class InactiveUserError extends Error {
  constructor() {
    super("This account is inactive");
    this.name = "InactiveUserError";
  }
}

const SALT_ROUNDS = 10;

// Computed once at module load so a login attempt for a nonexistent email
// still runs a bcrypt.compare against *something* — this keeps response
// timing (and the resulting error) indistinguishable from a wrong
// password for a real account, so login failures never reveal whether a
// given email is registered.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  "no-such-user-dummy-password",
  SALT_ROUNDS
);

export async function login(data: LoginInput) {
  const user = await prisma.users.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
      status: true,
      roles: { select: { id: true, name: true } },
    },
  });

  const passwordMatches = await bcrypt.compare(
    data.password,
    user?.password ?? DUMMY_PASSWORD_HASH
  );

  if (!user || !passwordMatches) {
    throw new InvalidCredentialsError();
  }

  if (user.status !== "active") {
    throw new InactiveUserError();
  }

  // Built explicitly (not via destructure-omit) so it is structurally
  // impossible for a controller to accidentally forward the password hash.
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    roles: user.roles,
  };
}
