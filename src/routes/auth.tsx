import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Outstand" },
      { name: "description", content: "Sign in to your Outstand habit tracker." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. FIX: Added onAuthStateChange. This actively listens for successful 
  // logins (including Google OAuth redirects) and routes them immediately.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate({ to: "/dashboard", replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    // 2. FIX: Strip trailing spaces from the email input
    const cleanEmail = email.trim();

    try {
      if (mode === "signup") {
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: { display_name: name || cleanEmail.split("@")[0] },
          },
        });
        
        if (error) throw error;
        
        // 3. FIX: Only navigate to onboarding IF Supabase returned an active session.
        // If email confirmation is required, session will be null, so we must keep them here.
        if (data.session) {
          navigate({ to: "/onboarding", replace: true });
        } else {
          toast.success("Welcome to Outstand", { description: "Check your inbox to confirm your email." });
          // Clear the form to visually indicate success
          setEmail("");
          setPassword("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: cleanEmail, 
          password 
        });
        
        if (error) throw error;
        
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      toast.error("Auth failed", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        toast.error("Google sign-in failed", { description: error.message });
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10 selection:bg-indigo-500/30">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2 transition-transform hover:scale-105">
          <div className="h-10 w-10 overflow-hidden rounded-xl shadow-[var(--shadow-glow)]">
            <img
              src="/outstand-logo.png"
              alt="Outstand Logo"
              className="h-full w-full object-cover"
            />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-white">Outstand</span>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 shadow-xl backdrop-blur-sm md:p-8">
          <h1 className="text-2xl font-bold text-white">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === "signin" ? "Stay focused. Beat phone addiction." : "Start your journey to a more focused life."}
          </p>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")} className="mt-6">
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-slate-950/80 p-1 mb-6">
              <TabsTrigger value="signin" className="rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Sign in</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Sign up</TabsTrigger>
            </TabsList>

            <form onSubmit={submit} className="space-y-4">
              <TabsContent value="signup" className="m-0 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-slate-300">Display name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" className="bg-black/20 border-white/10" />
                </div>
              </TabsContent>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  className="bg-black/20 border-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="bg-black/20 border-white/10"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11 mt-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-500 font-medium uppercase tracking-widest">
            <div className="h-px flex-1 bg-white/10" />
            or
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-3 h-11 border-white/10 bg-white/5 hover:bg-white/10 text-white"
            onClick={google}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C33.9 6.1 29.2 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.1 0 9.8-2 13.3-5.1l-6.1-5.2c-2 1.5-4.5 2.3-7.2 2.3-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.1 5.2C41 34.3 44 29.6 44 24c0-1.2-.1-2.3-.4-3.5z"/>
            </svg>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}
