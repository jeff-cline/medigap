import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prismaBase?: PrismaClient };

const base = globalForPrisma.prismaBase ?? new PrismaClient({ log: ["error", "warn"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prismaBase = base;

// Auto-assign a sequential reference number to every new Lead (displayed as 444-<10 digits>),
// regardless of which code path creates it.
export const db = base.$extends({
  query: {
    lead: {
      async create({ args, query }) {
        const data = args.data as Record<string, unknown> | undefined;
        if (data && data.refNum == null) {
          const c = await base.counter.upsert({ where: { name: "lead" }, update: { value: { increment: 1 } }, create: { name: "lead", value: 1 } });
          data.refNum = c.value;
        }
        return query(args);
      },
    },
  },
});
