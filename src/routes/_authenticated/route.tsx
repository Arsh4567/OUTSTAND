import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // OPTIMIZATION: getSession is lightning-fast because it checks local storage
    // instead of making a network request on every single page click.
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw redirect({ to: "/auth" });
    }
    
    return { user: session.user };
  },
  component: () => <Outlet />,
});
