import { NonRetriableError } from "inngest";
import { inngest } from "./client";
import { db } from "@/db"
import { topologicalSort } from "./utils";
import { NodeType, workflow } from "@/db/schema";
import { getExecutor } from "@/features/executions/lib/executor-registry";
import { eq } from "drizzle-orm";

export const executeWorkflow = inngest.createFunction(
  { id: "execute-workflow" },
  { event: "workflows/execute.workflow" },
  async ({ event, step }) => {
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
      });
    }

    return {
      workflowId,
      result: context
    };
  },
);
