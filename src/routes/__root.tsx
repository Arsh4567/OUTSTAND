import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { useEffect, type ReactNode } from "react";
import { Bot, RefreshCw, Home, ShieldAlert } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

// 1. ADD THIS IMPORT RIGHT HERE
import SidebarLayout from "@/components/layout/SidebarLayout"; 

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#050508] px-4 overflow-hidden selection:bg-indigo-500/30">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 max-w-md text-center p-8 rounded-3xl border border-white/10 bg-slate-950/60 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
          <Bot className="h-7 w-7" />
        </div>
        <h1 className="text-6xl font-black tracking-tighter text-white">404</h1>
        <h2 className="mt-3 text-lg font-bold text-slate-200 tracking-tight">Signal Lost in Deep Space</h2>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          The protocol or sector you are trying to access does not exist or has been relocated to another node.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Home className="h-4 w-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#050508] px-4 overflow-hidden selection:bg-rose-500/30">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-md text-center p-8 rounded-3xl border border-rose-500/20 bg-slate-950/60 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          System Exception Encountered
        </h1>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          An unexpected runtime anomaly occurred. Your persistent data is safe, but this execution context failed.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="w-full items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300"
          >
            <RefreshCw className="h-4 w-4 text-indigo-400" /> Reboot Subsystem
          </Button>
          <a
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all duration-300"
          >
            <Home className="h-4 w-4" /> Force Hard Reset to Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" },
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
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:url", content: "https://outstand-by-arsh.vercel.app" },
      { name: "twitter:title", content: "Outstand | Peak Performance & Habit Intelligence" },
      { name: "twitter:description", content: "Master your habits, maintain high-velocity streaks, and optimize your focus baselines." },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/MbFMKUuM2TWHnUX1cvLR8J9s9Jf1/social-images/social-1783582818919-1000035610.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/outstand-logo.png" },
      { rel: "icon", type: "image/png", href: "/outstand-logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap",
      },
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
      <head>
        <HeadContent />
      </head>
      <body className="bg-[#050508] text-slate-100 min-h-screen selection:bg-indigo-500/30">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* 2. WRAP APPSHELL WITH SIDEBARLAYOUT */}
      <SidebarLayout>
        <AppShell />
      </SidebarLayout>
      <Toaster />
    </QueryClientProvider>
  );
}
