"use client";

import { Button } from "@/components/ui/button";
// import { requireAuth } from "@/lib/auth-utils";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const Page = () => {
  // await requireAuth();

  const trpc = useTRPC();

  const testAI = useMutation(
    trpc.testAi.mutationOptions({
      onSuccess: (message) => {
        toast.success("AI job queued successfully" + message.message);
      },
      onError: (error) => {
        toast.error("Error queuing AI job: " + error.message);
      },
    })
  );

  return (
    <p>
      Workflows
      <Button onClick={() => testAI.mutate()} disabled={testAI.isPending}>
        Test ai
      </Button>
    </p>
  );
};

export default Page;
