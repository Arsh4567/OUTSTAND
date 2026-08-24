import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — OUTSTAND" }, { name: "description", content: "Sign in or create your OUTSTAND account." }] }),
  component: AuthPage,
});

function getAuthErrorFromUrl() {
  if (typeof window === "undefined") return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  return hash.get("error_description") || hash.get("error") || query.get("error_description") || query.get("error");
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const redirectOrigin = useMemo(() => (typeof window === "undefined" ? "" : window.location.origin), []);

  useEffect(() => {
    const urlError = getAuthErrorFromUrl();
    if (urlError) { toast.error("Sign-in could not be completed", { description: urlError.replace(/\+/g, " ") }); window.history.replaceState({}, document.title, "/auth"); }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => { if (mounted && data.session) navigate({ to: "/dashboard", replace: true }); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (mounted && session) navigate({ to: "/dashboard", replace: true }); });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, [navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading || oauthLoading) return;
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    if (!cleanEmail) return toast.error("Enter your email address");
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (mode === "signup" && !cleanName) return toast.error("Enter a display name");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password, options: { emailRedirectTo: `${redirectOrigin}/onboarding`, data: { display_name: cleanName, full_name: cleanName } } });
        if (error) throw error;
        if (data.session) navigate({ to: "/onboarding", replace: true });
        else { toast.success("Account created", { description: "Check your email and confirm your account before signing in." }); setPassword(""); }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      const friendly = message.toLowerCase().includes("invalid login credentials") ? "The email or password is incorrect." : message.toLowerCase().includes("email not confirmed") ? "Confirm your email first, then try again." : message;
      toast.error(mode === "signup" ? "Account creation failed" : "Sign-in failed", { description: friendly });
    } finally { setLoading(false); }
  };

  const google = async () => {
    if (loading || oauthLoading) return;
    setOauthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${redirectOrigin}/auth/callback?next=/dashboard`, queryParams: { prompt: "select_account" } } });
      if (error) throw error;
    } catch (error) { setOauthLoading(false); toast.error("Google sign-in failed", { description: error instanceof Error ? error.message : "Google sign-in failed." }); }
  };

  const busy = loading || oauthLoading;
  return <main className="relative min-h-screen overflow-hidden bg-[#03050a] text-white">
    <div className="pointer-events-none absolute inset-0"><div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-blue-500/8 blur-[120px]" /><div className="absolute -bottom-48 -right-32 h-[32rem] w-[32rem] rounded-full bg-slate-500/8 blur-[140px]" /></div>
    <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-5 py-8 lg:grid-cols-[1.05fr_.95fr] lg:px-10">
      <section className="hidden lg:block">
        <Link to="/" className="inline-flex items-center gap-3"><img src="/outstand-logo.png" alt="OUTSTAND" className="h-12 w-12 rounded-2xl border border-white/10 object-cover" /><div><div className="text-lg font-black tracking-tight">OUTSTAND</div><div className="text-[10px] font-bold uppercase tracking-[.3em] text-slate-500">Personal system</div></div></Link>
        <div className="mt-16 max-w-xl"><div className="mb-5 text-[10px] font-black uppercase tracking-[.22em] text-blue-300">A clearer way to move forward</div><h1 className="text-5xl font-black leading-[1.02] tracking-[-.04em] xl:text-6xl">Your focus deserves a system.</h1><p className="mt-6 max-w-lg text-base leading-7 text-slate-400">Track habits, protect your attention, study with intent, and turn small wins into lasting momentum.</p><div className="mt-10 grid max-w-lg grid-cols-3 gap-3">{[["01", "Habits"], ["02", "Focus"], ["03", "Momentum"]].map(([number, label]) => <div key={number} className="rounded-2xl border border-white/8 bg-white/[0.035] p-4"><div className="text-[10px] font-black tracking-[.2em] text-blue-300/70">{number}</div><div className="mt-2 text-sm font-bold text-slate-200">{label}</div></div>)}</div></div>
      </section>
      <section className="mx-auto w-full max-w-md">
        <div className="mb-7 flex items-center justify-center lg:hidden"><Link to="/" className="inline-flex items-center gap-3"><img src="/outstand-logo.png" alt="OUTSTAND" className="h-11 w-11 rounded-2xl border border-white/10 object-cover" /><span className="text-xl font-black tracking-tight">OUTSTAND</span></Link></div>
        <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-5 shadow-[0_30px_100px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-7">
          <div className="mb-7"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-blue-300/70"><LockKeyhole className="h-3.5 w-3.5" /> Secure access</div><h2 className="mt-3 text-3xl font-black tracking-tight">{mode === "signin" ? "Welcome back." : "Set up your account."}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{mode === "signin" ? "Pick up where you left off." : "Create your OUTSTAND account in under a minute."}</p></div>
          <Tabs value={mode} onValueChange={(value) => setMode(value as "signin" | "signup")}><TabsList className="grid h-11 w-full grid-cols-2 rounded-xl border border-white/8 bg-black/20 p-1"><TabsTrigger value="signin" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-950">Sign in</TabsTrigger><TabsTrigger value="signup" className="rounded-lg text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-slate-950">Create account</TabsTrigger></TabsList></Tabs>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && <label className="block"><span className="mb-2 block text-xs font-bold text-slate-300">Display name</span><Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="Your name" disabled={busy} className="h-12 rounded-xl border-white/10 bg-black/20 px-4 text-white placeholder:text-slate-600 focus-visible:ring-blue-400/40" /></label>}
            <label className="block"><span className="mb-2 block text-xs font-bold text-slate-300">Email address</span><Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required placeholder="you@example.com" disabled={busy} className="h-12 rounded-xl border-white/10 bg-black/20 px-4 text-white placeholder:text-slate-600 focus-visible:ring-blue-400/40" /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold text-slate-300">Password</span><div className="relative"><Input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required placeholder="At least 6 characters" disabled={busy} className="h-12 rounded-xl border-white/10 bg-black/20 px-4 pr-12 text-white placeholder:text-slate-600 focus-visible:ring-blue-400/40" /><button type="button" onClick={() => setShowPassword((value) => !value)} disabled={busy} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.05] hover:text-slate-200">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
            <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-blue-400 font-black text-slate-950 shadow-[0_10px_30px_rgba(59,130,246,.16)] hover:bg-blue-300">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>{mode === "signin" ? "Sign in" : "Create account"}</span><ArrowRight className="h-4 w-4" /></>}</Button>
          </form>
          <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-white/8" /><span className="text-[10px] font-black uppercase tracking-[.22em] text-slate-600">or continue with</span><div className="h-px flex-1 bg-white/8" /></div>
          <Button type="button" variant="outline" onClick={google} disabled={busy} className="h-12 w-full gap-3 rounded-xl border-white/10 bg-white/[0.035] font-bold text-white hover:bg-white/[0.08]">{oauthLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] font-black text-slate-700">G</span>} Continue with Google</Button>
          <div className="mt-6 grid grid-cols-2 gap-3 text-[10px] font-semibold text-slate-500"><div className="flex items-center gap-2 rounded-xl border border-white/7 bg-white/[0.025] p-3"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" /> Secure auth</div><div className="flex items-center gap-2 rounded-xl border border-white/7 bg-white/[0.025] p-3"><CheckCircle2 className="h-4 w-4 shrink-0 text-blue-300" /> Your data stays yours</div></div>
        </div>
        <p className="mt-5 text-center text-[11px] leading-5 text-slate-600">By continuing, you agree to use OUTSTAND responsibly and keep your account secure.</p>
      </section>
    </div>
  </main>;
}