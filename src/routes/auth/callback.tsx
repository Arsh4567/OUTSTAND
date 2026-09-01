import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing you in — Outstand" },
      { name: "description", content: "Completing your secure Outstand sign-in." },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const finish = async () => {
      try {
        const url = new URL(window.location.href);
        const nextParam = url.searchParams.get("next");
        const next = nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";
        const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const hashError = hash.get("error_description") || hash.get("error");
        if (hashError) throw new Error(hashError.replace(/\+/g, " "));

        const code = url.searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        let session = null;
        for (let attempt = 0; attempt < 25 && !session; attempt += 1) {
          const result = await supabase.auth.getSession();
          if (result.error) throw result.error;
          session = result.data.session;
          if (!session) await new Promise((resolve) => setTimeout(resolve, 100));
        }
        if (!session) throw new Error("No active session was created. Please try signing in again.");

        if (active) {
          window.history.replaceState({}, document.title, "/auth/callback");
          navigate({ to: next, replace: true });
        }
      } catch (err) {
        console.error("OAuth callback failed", err);
        if (active) setError(err instanceof Error ? err.message : "Sign-in could not be completed.");
      }
    };

    void finish();
    return () => {
      active = false;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#05070d] px-4 py-10 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
          <div className="w-full rounded-[28px] border border-red-400/15 bg-white/[0.04] p-7 text-center shadow-2xl backdrop-blur-2xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-300"><AlertCircle className="h-7 w-7" /></div>
            <h1 className="mt-5 text-2xl font-black tracking-tight">Sign-in couldn't finish</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">{error}</p>
            <button type="button" onClick={() => navigate({ to: "/auth", replace: true })} className="mt-6 h-11 w-full rounded-xl bg-white text-sm font-bold text-slate-950 transition hover:bg-slate-200">Return to sign in</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#05070d] px-4 text-white">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_45px_rgba(34,211,238,.16)]"><CheckCircle2 className="h-7 w-7 text-cyan-200" /></div>
        <h1 className="mt-6 text-2xl font-black tracking-tight">Securing your session</h1>
        <p className="mt-2 text-sm text-slate-500">Just a moment. Outstand is finishing sign-in.</p>
        <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-cyan-300" />
      </div>
    </div>
  );
}