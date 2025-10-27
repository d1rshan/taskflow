import { db } from "@/db";
import { workflow } from "@/db/schema";
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init";
import { and, eq } from "drizzle-orm";
import { generateSlug } from "random-word-slugs";
import z from "zod";

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
    .mutation(({ ctx, input }) => {
      return db
        .delete(workflow)
        .where(
          and(eq(workflow.id, input.id), eq(workflow.userId, ctx.auth.user.id))
        )
        .returning();
    }),
  updateName: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(({ ctx, input }) => {
      return db
        .update(workflow)
        .set({ name: input.name })
        .where(
          and(eq(workflow.id, input.id), eq(workflow.userId, ctx.auth.user.id))
        )
        .returning();
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return db.query.workflow.findFirst({
        where: and(
          eq(workflow.id, input.id),
          eq(workflow.userId, ctx.auth.user.id)
        ),
      });
    }),
  getMany: protectedProcedure.query(({ ctx }) => {
    return db.query.workflow.findMany({
      where: eq(workflow.userId, ctx.auth.user.id),
    });
  }),
});
