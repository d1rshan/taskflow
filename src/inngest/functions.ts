import { db } from "@/db";
import { inngest } from "./client";
import { workflow } from "@/db/schema";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

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

export const execute = inngest.createFunction(
  { id: "execute-ai" },
  { event: "execute/ai" },
  async ({ event, step }) => {
    await step.sleep("pretend", "5s");
    const { steps: geminiSteps } = await step.ai.wrap(
      "gemini-generate-text",
      generateText,
      {
        model: google("gemini-2.5-flash"),
        system: "You are a helpful assistant.",
        prompt: "What is 2 + 2?",
      }
    );

    return {
      geminiSteps,
    };
  }
);
