import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { db } from "@/db"
import { topologicalSort } from "./utils";
import { NodeType, workflow } from "@/db/schema";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { eq } from "drizzle-orm";
import { httpRequestChannel } from "./channels/http-request";
import { manualTriggerChannel } from "./channels/manual-trigger";
import { googleFormTriggerChannel } from "./channels/google-form-trigger";
import { geminiChannel } from "./channels/gemini";

export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    retries: 0, // TODO: Remove in production
  },
  {
    event: "workflows/execute.workflow",
    channels: [
      httpRequestChannel(),
      manualTriggerChannel(),
      googleFormTriggerChannel(),
      geminiChannel(),
    ],
  },
  async ({ event, step, publish }) => {
    const workflowId = event.data.workflowId;

    if (!workflowId) {
      throw new NonRetriableError("Workflow ID is missing");
    }

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
        publish
      });
    }

    return {
      workflowId,
      result: context
    };
  },
);
