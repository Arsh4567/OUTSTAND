import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // Only access browser features inside the router configuration if necessary
    scrollRestoration: typeof window !== 'undefined', 
    defaultPreloadStaleTime: 0,
  });

  return router;
};
