import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { OutstandChatShell } from "@/components/ai/OutstandChatShell";

function AuthenticatedLayout() {
  return (
    <>
      <Outlet />
      <OutstandChatShell />
    </>
  );
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    try {
      // Supabase sessions are restored from browser storage. During a hard
      // refresh the server-side route guard cannot reliably see that session,
      // so authentication must be enforced by the client-aware app shell.
      if (typeof window === "undefined") {
        return { user: null };
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Supabase Auth Error:", error);
        throw redirect({ to: "/auth" });
      }

      if (!data?.session) {
        throw redirect({ to: "/auth" });
      }

      return { user: data.session.user };
    } catch (error) {
      if (error instanceof Response) throw error;
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});
