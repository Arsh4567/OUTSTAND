import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, createRootRouteWithContext, useRouter, useLocation, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Bot, RefreshCw, Home, ShieldAlert } from "lucide-react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { QuickActions } from "@/components/global/QuickActions";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050508] px-4 selection:bg-indigo-500/30">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[120px]" />
      <div className="relative z-10 max-w-md rounded-3xl border border-white/10 bg-slate-950/60 p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]"><Bot className="h-7 w-7" /></div>
        <h1 className="text-6xl font-black tracking-tighter text-white">404</h1>
        <h2 className="mt-3 text-lg font-bold tracking-tight text-slate-200">Signal Lost in Deep Space</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">The protocol or sector you are trying to access does not exist or has been relocated.</p>
        <Link to="/" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] transition hover:bg-indigo-500"><Home className="h-4 w-4" /> Return to Dashboard</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050508] px-4 selection:bg-rose-500/30">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/10 blur-[120px]" />
      <div className="relative z-10 max-w-md rounded-3xl border border-rose-500/20 bg-slate-950/60 p-8 text-center shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-rose-500/30 bg-rose-500/20 text-rose-400"><ShieldAlert className="h-7 w-7" /></div>
        <h1 className="text-xl font-bold tracking-tight text-white">System Exception Encountered</h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">An unexpected runtime anomaly occurred. Your persistent data is safe.</p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button onClick={() => { router.invalidate(); reset(); }} className="w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-slate-800"><RefreshCw className="h-4 w-4 text-indigo-400" /> Reboot Subsystem</Button>
          <a href="/" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] transition hover:bg-indigo-500"><Home className="h-4 w-4" /> Force Hard Reset to Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      // Keep browser zoom unrestricted so users with low vision can enlarge the app.
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#050508" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Outstand" },
      { name: "application-name", content: "Outstand" },
      { name: "format-detection", content: "telephone=no" },
      { title: "Outstand | Premium Habit, Focus & Momentum Intelligence" },
      { name: "description", content: "Next-generation focus optimization, dopamine tracking, and habit protocol engineering designed for peak performers." },
      { name: "author", content: "Arsh" },
      { property: "og:site_name", content: "Outstand" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://outstand-by-arsh.vercel.app" },
      { property: "og:title", content: "Outstand | Peak Performance & Habit Intelligence" },
      { property: "og:description", content: "Master your habits, maintain high-velocity streaks, and optimize your focus baselines." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/MbFMKUuM2TWHnUX1cvLR8J9s9Jf1/social-images/social-1783582818919-1000035610.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Outstand | Peak Performance & Habit Intelligence" },
      { name: "twitter:description", content: "Master your habits, maintain high-velocity streaks, and optimize your focus baselines." },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/MbFMKUuM2TWHnUX1cvLR8J9s9Jf1/social-images/social-1783582818919-1000035610.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "/premium-ui.css" },
      { rel: "stylesheet", href: "/performance.css" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/outstand-logo.png" },
      { rel: "icon", type: "image/png", href: "/outstand-logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark bg-[#050508] text-slate-100 antialiased">
      <head><HeadContent /></head>
      <body className="min-h-screen bg-[#050508] text-slate-100 selection:bg-indigo-500/30">
        {children}<Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { pathname } = useLocation();
  const isNoSidebarRoute = pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/onboarding");
  return (
    <QueryClientProvider client={queryClient}>
      {isNoSidebarRoute ? <AppShell /> : <SidebarLayout><AppShell /></SidebarLayout>}
      <Toaster />
      <QuickActions />
    </QueryClientProvider>
  );
}
