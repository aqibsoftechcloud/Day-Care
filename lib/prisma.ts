import { Prisma, PrismaClient } from "@/app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

/**
 * Identifies the generated client's data model (every model's scalar
 * fields). In development the client is cached on `globalThis` so hot
 * reloads don't open new connection pools — but that cache used to outlive
 * a `prisma generate`: the dev server kept serving the OLD client and every
 * query touching a new column failed with "Unknown field ... for select
 * statement" until the process was restarted. Comparing this fingerprint
 * makes a regenerated client replace the cached one automatically.
 */
const schemaFingerprint = JSON.stringify(
  Object.entries(Prisma)
    .filter(([name]) => name.endsWith("ScalarFieldEnum"))
    .sort(([a], [b]) => a.localeCompare(b))
);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaFingerprint: string | undefined;
};

const cached = globalForPrisma.prismaSchemaFingerprint === schemaFingerprint ? globalForPrisma.prisma : undefined;

if (globalForPrisma.prisma && !cached) {
  // Stale client from before the last schema change — release its pool.
  void globalForPrisma.prisma.$disconnect().catch(() => undefined);
}

export const prisma = cached ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaFingerprint = schemaFingerprint;
}
