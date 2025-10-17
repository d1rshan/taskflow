"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Page = () => {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.getWorkflows.queryOptions());

  const createWorkflow = useMutation(
    trpc.createWorkflow.mutationOptions({
      onSuccess: () => {
        toast.success("Job queued"); // TODO: query not invalidated, but inngest realtime to be added which will update UI
      },
    })
  );

  const testAi = useMutation(
    trpc.testAi.mutationOptions({
      onSuccess: () => {
        toast.success("AI job queued");
      },
    })
  );

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center">
      <div>{JSON.stringify(data, null, 2)}</div>
      <Button disabled={testAi.isPending} onClick={() => testAi.mutate()}>
        Test AI
      </Button>
      <Button
        disabled={createWorkflow.isPending}
        onClick={() => createWorkflow.mutate()}
      >
        Create workflow
      </Button>
    </div>
  );
};

export default Page;
