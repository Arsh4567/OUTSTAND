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
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("Supabase Auth Error:", error);
      if (!data?.session) throw redirect({ to: "/auth" });
      return { user: data.session.user };
    } catch (error) {
      if (error instanceof Response) throw error;
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});
