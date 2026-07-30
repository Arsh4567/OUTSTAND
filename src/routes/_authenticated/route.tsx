import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

function AuthenticatedLayout() {
  return <Outlet />;
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // We wrap this in a try-catch to ensure Supabase doesn't crash the router silently
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Supabase Auth Error:", error);
      }
      
      if (!data?.session) {
        throw redirect({ to: "/auth" });
      }
      
      return { user: data.session.user };
    } catch (err) {
      // If it's a redirect, we must let TanStack handle it
      if (err instanceof Error && err.message.includes('redirect')) {
        throw err;
      }
      // Otherwise, throw redirect to auth if session fetching fails entirely
      throw redirect({ to: "/auth" });
    }
  },
  // 🔥 THE GLOBAL ROUTER CRASH CATCHER 🔥
  errorComponent: ({ error }) => (
    <div className="p-6 m-4 mt-20 border-2 border-red-500 bg-red-950/90 rounded-2xl text-white shadow-2xl relative z-50">
      <h2 className="text-2xl font-black text-red-500 mb-2">ROUTER CRASH!</h2>
      <p className="text-sm text-red-200 mb-4">Screenshot this and send it to me:</p>
      <div className="bg-black/90 p-4 rounded-xl text-xs font-mono text-red-400 overflow-auto whitespace-pre-wrap">
        {error?.message || "Unknown error occurred"}
      </div>
      <div className="bg-black/90 p-4 rounded-xl text-[10px] font-mono text-red-300 mt-2 overflow-auto h-48 whitespace-pre-wrap">
        {error?.stack || "No stack trace available"}
      </div>
    </div>
  ),
  component: AuthenticatedLayout,
});
