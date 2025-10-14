import { db } from "@/db";
import { inngest } from "./client";
import { workflow } from "@/db/schema";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("transcribing", "5s");

    await step.sleep("sending-to-ai", "3s");

    await step.sleep("finalizing", "2s");

    await step.run("create-workflow", () => {
      return db
        .insert(workflow)
        .values({ name: "Hello World Workflow" })
        .returning();
    });
  }
);
