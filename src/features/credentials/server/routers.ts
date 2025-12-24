import { PAGINATION } from "@/config/constants";
import { credential, CredentialType } from "@/db/schema";
import { db } from "@/db"
import { and, eq, ilike, sql, desc } from "drizzle-orm";
import { createTRPCRouter, premiumProcedure, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { encrypt } from "@/lib/encryption";

export const credentialsRouter = createTRPCRouter({
  create: premiumProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        // Use nativeEnum to validate against your schema object
        type: z.enum(CredentialType),
        value: z.string().min(1, "Value is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { name, value, type } = input;
      const [newCredential] = await db
        .insert(credential)
        .values({
          name,
          userId: ctx.auth.user.id,
          type,
          value: encrypt(value), // TODO: Consider encrypting in production
        })
        .returning();

      return newCredential;
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(credential)
        .where(
          and(
            eq(credential.id, input.id),
            eq(credential.userId, ctx.auth.user.id)
          )
        )
        .returning();

      return deleted;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required"),
        type: z.enum(CredentialType),
        value: z.string().min(1, "Value is required"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, name, type, value } = input;

      const [updated] = await db
        .update(credential)
        .set({
          name,
          type,
          value: encrypt(value),
        })
        .where(
          and(
            eq(credential.id, id),
            eq(credential.userId, ctx.auth.user.id)
          )
        )
        .returning();

      return updated;
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await db.query.credential.findFirst({
        where: and(
          eq(credential.id, input.id),
          eq(credential.userId, ctx.auth.user.id)
        ),
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Credential not found",
        });
      }

      return item;
    }),

  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(PAGINATION.DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(PAGINATION.MIN_PAGE_SIZE)
          .max(PAGINATION.MAX_PAGE_SIZE)
          .default(PAGINATION.DEFAULT_PAGE_SIZE),
        search: z.string().default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;
      const userId = ctx.auth.user.id;

      // 1. Define shared where clause to ensure consistency between Count and Select
      const whereClause = and(
        eq(credential.userId, userId),
        search ? ilike(credential.name, `%${search}%`) : undefined
      );

      // 2. Execute queries in parallel
      const [items, [{ count }]] = await Promise.all([
        db
          .select()
          .from(credential)
          .where(whereClause)
          .orderBy(desc(credential.updatedAt))
          .limit(pageSize)
          .offset((page - 1) * pageSize),

        db
          .select({ count: sql<number>`count(*)` })
          .from(credential)
          .where(whereClause),
      ]);

      const totalCount = Number(count);
      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        items,
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    }),

  getByType: protectedProcedure
    .input(
      z.object({
        type: z.enum(CredentialType),
      })
    )
    .query(async ({ input, ctx }) => {
      const { type } = input;

      // Using the Relational Query API here is cleaner for simple "findMany" logic
      return await db.query.credential.findMany({
        where: and(
          eq(credential.type, type),
          eq(credential.userId, ctx.auth.user.id)
        ),
        orderBy: desc(credential.updatedAt),
      });
    }),
});
