import "server-only"; // <-- ensure this file cannot be imported from the client
import {
  createTRPCOptionsProxy,
  TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);
export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});
// If your router is on a separate server, pass a client:

export const caller = appRouter.createCaller(createTRPCContext);

/**
 * Prefetches a TRPC query on the server, using the stable request-scoped query client.
 *
 * Prefetches an infinite query when `queryOptions.queryKey[1]?.type === "infinite"`, otherwise prefetches a normal query.
 *
 * @param queryOptions - TRPC query options describing the query to prefetch (query key, fetcher, and related options)
 */
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T
) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") {
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}

/**
 * Restores React Query state from the server and renders the provided children within the hydration boundary.
 *
 * @param props.children - React nodes to render after hydrating the client query cache with server state
 * @returns A React element that wraps `children` in a hydration boundary populated with the dehydrated query state
 */
export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}