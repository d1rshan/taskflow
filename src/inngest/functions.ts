import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { db } from "@/db";
import { topologicalSort } from "./utils";
import { ExecutionStatus, NodeType, workflow, execution } from "@/db/schema";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { eq } from "drizzle-orm";
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/manual-trigger";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { geminiChannel } from "./channels/gemini";
import { openAiChannel } from "./channels/openai";
import { anthropicChannel } from "./channels/anthropic";

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: process.env.NODE_ENV === "production" ? 3 : 0,
    onFailure: async ({ event }) => {
      // Drizzle: Update execution on failure
      return db
        .update(execution)
        .set({
          status: ExecutionStatus.FAILED,
          error: event.data.error.message,
          errorStack: event.data.error.stack,
        })
        .where(eq(execution.inngestEventId, event.data.event.id!));
    },
  },
  {
    event: "workflows/execute.workflow",
    channels: [
      httpRequestChannel(),
      manualTriggerChannel(),
      googleFormTriggerChannel(),
      geminiChannel(),
      openAiChannel(),
      anthropicChannel(),
    ],
  },
  async ({ event, step, publish }) => {
    const inngestEventId = event.id;
    const workflowId = event.data.workflowId;

    if (!inngestEventId || !workflowId) {
      throw new NonRetriableError("Event ID or workflow ID is missing");
    }

    // Drizzle: Create execution log
    await step.run("create-execution", async () => {
      return db.insert(execution).values({
        workflowId,
        inngestEventId,
        status: ExecutionStatus.RUNNING, // Explicitly set starting status if desired, or rely on default
      });
    });

    const sortedNodes = await step.run("prepare-workflow", async () => {
      const workflowData = await db.query.workflow.findFirst({
        where: eq(workflow.id, workflowId),
        with: {
          nodes: true,
          connections: true,
        },
      });

      if (!workflowData) {
        throw new Error("Workflow not found");
      }

      return topologicalSort(workflowData.nodes, workflowData.connections);
    });

    // Initialize the context with any initial data from the trigger
    let context = event.data.initialData || {};

    // Execute each node
    for (const node of sortedNodes) {
      const executor = getExecutor(node.type as NodeType);
      context = await executor({
        data: node.data as Record<string, unknown>,
        nodeId: node.id,
        context,
        step,
        publish,
      });
    }

    // Drizzle: Update execution on success
    await step.run("update-execution", async () => {
      return db
        .update(execution)
        .set({
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          output: context,
        })
        .where(eq(execution.inngestEventId, inngestEventId));
    });

    return {
      workflowId,
      result: context,
    };
  }
);
