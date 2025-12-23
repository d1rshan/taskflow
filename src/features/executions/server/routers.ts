import { db } from "@/db";
import { execution, workflow } from "@/db/schema";
import { PAGINATION } from "@/config/constants";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import z from "zod";

export const executionsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select({
          execution: execution,
          workflow: {
            id: workflow.id,
            name: workflow.name,
          },
        })
        .from(execution)
        .innerJoin(workflow, eq(execution.workflowId, workflow.id))
        .where(
          and(
            eq(execution.id, input.id),
            eq(workflow.userId, ctx.auth.user.id)
          )
        )
        .limit(1);

      const item = result[0];

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Execution not found",
        });
      }

      return {
        ...item.execution,
        workflow: item.workflow,
      };
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
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize } = input;
      const userId = ctx.auth.user.id;

      const whereClause = eq(workflow.userId, userId);

      const [data, [{ count }]] = await Promise.all([
        // 1. Fetch Items
        db
          .select({
            execution: execution,
            workflow: {
              id: workflow.id,
              name: workflow.name,
            },
          })
          .from(execution)
          .innerJoin(workflow, eq(execution.workflowId, workflow.id))
          .where(whereClause)
          .orderBy(desc(execution.startedAt))
          .limit(pageSize)
          .offset((page - 1) * pageSize),

        // 2. Fetch Count
        db
          .select({ count: sql<number>`count(*)` })
          .from(execution)
          .innerJoin(workflow, eq(execution.workflowId, workflow.id))
          .where(whereClause),
      ]);

      const totalCount = Number(count);
      const totalPages = Math.ceil(totalCount / pageSize);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      const items = data.map((row) => ({
        ...row.execution,
        workflow: row.workflow,
      }));

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
