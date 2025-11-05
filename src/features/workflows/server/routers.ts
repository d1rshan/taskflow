import { db } from "@/db";
import { workflow } from "@/db/schema";
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init";
import { and, eq, ilike, sql } from "drizzle-orm";
import { generateSlug } from "random-word-slugs";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { TRPCError } from "@trpc/server";

export const workflowsRouter = createTRPCRouter({
  create: premiumProcedure.mutation(async ({ ctx }) => {
    return (
      await db
        .insert(workflow)
        .values({
          name: generateSlug(3),
          userId: ctx.auth.user.id,
        })
        .returning()
    )[0];
  }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return (
        await db
          .delete(workflow)
          .where(
            and(eq(workflow.id, input.id), eq(workflow.userId, ctx.auth.user.id))
          )
          .returning()
      )[0]
    }),
  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return (
        await db
          .update(workflow)
          .set({ name: input.name })
          .where(
            and(eq(workflow.id, input.id), eq(workflow.userId, ctx.auth.user.id))
          )
          .returning()
      )[0]
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const item = await db.query.workflow.findFirst({
        where: and(
          eq(workflow.id, input.id),
          eq(workflow.userId, ctx.auth.user.id),
        ),
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
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

      // --- Main query ---
      const items = await db
        .select()
        .from(workflow)
        .where(
          and(
            eq(workflow.userId, userId),
            search ? ilike(workflow.name, `%${search}%`) : sql`TRUE`
          )
        )
        .orderBy(sql`${workflow.updatedAt} DESC`)
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      // --- Count query ---
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(workflow)
        .where(
          and(
            eq(workflow.userId, userId),
            search ? ilike(workflow.name, `%${search}%`) : sql`TRUE`
          )
        );

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
});
