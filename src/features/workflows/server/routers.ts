import { db } from "@/db";
import { workflow, node, connection } from "@/db/schema"; // Import all relevant tables
import { NodeType } from "@/db/schema"; // Import your manual Enum object
import {
  createTRPCRouter,
  premiumProcedure,
  protectedProcedure,
} from "@/trpc/init";
import { and, eq, ilike, sql, desc } from "drizzle-orm";
import { generateSlug } from "random-word-slugs";
import z from "zod";
import { PAGINATION } from "@/config/constants";
import { TRPCError } from "@trpc/server";
import type { Node, Edge } from "@xyflow/react";
import { sendWorkflowExecution } from "@/inngest/utils";

export const workflowsRouter = createTRPCRouter({
  execute: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // 1. Fetch the workflow
      const existingWorkflow = await db.query.workflow.findFirst({
        where: and(
          eq(workflow.id, input.id),
          eq(workflow.userId, ctx.auth.user.id)
        ),
      });

      // 2. Mimic "OrThrow" behavior
      if (!existingWorkflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        });
      }

      // 3. Send event to Inngest
      await sendWorkflowExecution({
        workflowId: input.id,
      });

      return existingWorkflow;
    }),
  create: premiumProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.auth.user.id;
    const name = generateSlug(3);

    // Prisma's "Nested Write" equivalent in Drizzle is a Transaction
    return await db.transaction(async (tx) => {
      // 1. Create Workflow
      const [newWorkflow] = await tx
        .insert(workflow)
        .values({
          name,
          userId,
        })
        .returning();

      // 2. Create Initial Node linked to Workflow
      await tx.insert(node).values({
        workflowId: newWorkflow.id,
        name: NodeType.INITIAL,
        type: NodeType.INITIAL,
        position: { x: 0, y: 0 }, // Drizzle handles the JSON stringify automatically
        data: {},
      });

      return newWorkflow;
    });
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
      )[0];
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        nodes: z.array(
          z.object({
            id: z.string(),
            type: z.string().nullish(),
            position: z.object({ x: z.number(), y: z.number() }),
            data: z.record(z.string(), z.any()).optional(),
          }),
        ),
        edges: z.array(
          z.object({
            source: z.string(),
            target: z.string(),
            sourceHandle: z.string().nullish(),
            targetHandle: z.string().nullish(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, nodes, edges } = input;
      const userId = ctx.auth.user.id;

      // 1. Verify ownership before starting the transaction
      const existingWorkflow = await db.query.workflow.findFirst({
        where: and(eq(workflow.id, id), eq(workflow.userId, userId)),
      });

      if (!existingWorkflow) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        });
      }

      // 2. Transaction to replace Nodes and Edges
      return await db.transaction(async (tx) => {
        // A. Delete existing nodes 
        // (Cascading delete in Postgres will automatically remove the connections)
        await tx.delete(node).where(eq(node.workflowId, id));

        // B. Create Nodes (only if there are nodes to insert)
        if (nodes.length > 0) {
          await tx.insert(node).values(
            nodes.map((n) => ({
              id: n.id,
              workflowId: id,
              name: n.type || "unknown", // Fallback name
              type: (n.type as NodeType) || NodeType.INITIAL, // Fallback to safe Enum
              position: n.position,
              data: n.data || {},
            }))
          );
        }

        // C. Create Connections (only if there are edges to insert)
        if (edges.length > 0) {
          await tx.insert(connection).values(
            edges.map((edge) => ({
              workflowId: id,
              fromNodeId: edge.source,
              toNodeId: edge.target,
              fromOutput: edge.sourceHandle || "main",
              toInput: edge.targetHandle || "main",
            }))
          );
        }

        // D. Update workflow's updatedAt timestamp
        const [updatedWorkflow] = await tx
          .update(workflow)
          .set({ updatedAt: new Date() })
          .where(and(eq(workflow.id, id), eq(workflow.userId, userId)))
          .returning();

        return updatedWorkflow;
      });
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
      )[0];
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.auth.user.id;

      // 1. Fetch Workflow with Relations
      const item = await db.query.workflow.findFirst({
        where: and(eq(workflow.id, input.id), eq(workflow.userId, userId)),
        with: {
          nodes: true,
          connections: true,
        },
      });

      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow not found",
        });
      }

      // 2. Transform server nodes to react-flow compatible nodes
      // Drizzle types JSON columns as 'unknown' or generic object, so we cast if specific shape needed
      const nodes: Node[] = item.nodes.map((node) => ({
        id: node.id,
        type: node.type,
        position: node.position as { x: number; y: number },
        data: (node.data as Record<string, unknown>) || {},
      }));

      // 3. Transform server connections to react-flow compatible edges
      const edges: Edge[] = item.connections.map((conn) => ({
        id: conn.id,
        source: conn.fromNodeId,
        target: conn.toNodeId,
        sourceHandle: conn.fromOutput,
        targetHandle: conn.toInput,
      }));

      return {
        id: item.id,
        name: item.name,
        nodes,
        edges,
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
        search: z.string().default(""),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search } = input;
      const userId = ctx.auth.user.id;

      // Filter Logic
      const whereClause = and(
        eq(workflow.userId, userId),
        search ? ilike(workflow.name, `%${search}%`) : undefined
      );

      // --- Main query ---
      const items = await db
        .select()
        .from(workflow)
        .where(whereClause)
        .orderBy(desc(workflow.updatedAt)) // Use desc helper
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      // --- Count query ---
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(workflow)
        .where(whereClause);

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
