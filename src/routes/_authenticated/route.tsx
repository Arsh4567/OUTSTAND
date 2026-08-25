import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { OutstandChatShell } from "@/components/ai/OutstandChatShell";
import { NotificationPermissionBanner } from "@/components/notification-permission-banner";

function AuthenticatedLayout() {
  return (
    <>
      <NotificationPermissionBanner />
      <Outlet />
      <OutstandChatShell />
    </>
  );
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    try {
      // Authenticated routes are client-only because the Supabase session is
      // restored from browser storage. Do not let a transient auth hydration
      // race during an OAuth redirect decide the route before Supabase has had
      // a chance to finish restoring the session.
      if (typeof window === "undefined") {
        return { user: null };
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Supabase Auth Error:", error);
        throw redirect({ to: "/auth" });
      }

      if (!data?.session) {
        // Give Supabase a single event-loop turn to finish processing an OAuth
        // callback before declaring the user unauthenticated. This prevents
        // the callback -> route transition race that can briefly show the app
        // and then bounce the user back to /auth.
        await new Promise((resolve) => setTimeout(resolve, 0));
        const retry = await supabase.auth.getSession();
        if (retry.error || !retry.data?.session) {
          throw redirect({ to: "/auth" });
        }
        return { user: retry.data.session.user };
      }

      return { user: data.session.user };
    } catch (error) {
      if (error instanceof Response) throw error;
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});
