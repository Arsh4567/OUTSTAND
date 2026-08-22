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
  return <div className="flex min-h-screen items-center justify-center bg-[#05070d] px-4"><div className="relative z-10 max-w-md rounded-[24px] border border-white/[0.07] bg-white/[0.025] p-8 text-center backdrop-blur-xl"><div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] text-cyan-300"><Bot className="h-6 w-6" /></div><h1 className="text-5xl font-black tracking-[-0.05em] text-white">404</h1><h2 className="mt-3 text-base font-bold text-slate-200">Page not found</h2><p className="mt-2 text-xs leading-5 text-slate-500">This page doesn't exist or has moved.</p><Link to="/" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-200"><Home className="h-4 w-4" /> Return home</Link></div></div>;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return <div className="flex min-h-screen items-center justify-center bg-[#05070d] px-4"><div className="max-w-md rounded-[24px] border border-rose-400/15 bg-white/[0.025] p-8 text-center backdrop-blur-xl"><div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl border border-rose-400/15 bg-rose-400/[0.05] text-rose-300"><ShieldAlert className="h-6 w-6" /></div><h1 className="text-lg font-black text-white">Something went wrong</h1><p className="mt-2 text-xs leading-5 text-slate-500">The page hit an unexpected error. Your saved data is safe.</p><div className="mt-5 flex flex-col gap-2"><Button onClick={() => { router.invalidate(); reset(); }} variant="default" className="w-full"><RefreshCw className="h-4 w-4" /> Try again</Button><Link to="/" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"><Home className="h-4 w-4" /> Go home</Link></div></div></div>;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({ meta: [
    { charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" }, { name: "theme-color", content: "#05070d" }, { name: "mobile-web-app-capable", content: "yes" }, { name: "apple-mobile-web-app-capable", content: "yes" }, { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" }, { name: "apple-mobile-web-app-title", content: "Outstand" }, { name: "application-name", content: "Outstand" }, { name: "format-detection", content: "telephone=no" }, { title: "Outstand | Premium Habit, Focus & Momentum Intelligence" }, { name: "description", content: "Next-generation focus optimization, dopamine tracking, and habit protocol engineering designed for peak performers." }, { name: "author", content: "Arsh" }, { property: "og:site_name", content: "Outstand" }, { property: "og:type", content: "website" }, { property: "og:url", content: "https://outstand-by-arsh.vercel.app" }, { property: "og:title", content: "Outstand | Peak Performance & Habit Intelligence" }, { property: "og:description", content: "Master your habits, maintain high-velocity streaks, and optimize your focus baselines." }, { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/MbFMKUuM2TWHnUX1cvLR8J9s9Jf1/social-images/social-1783582818919-1000035610.webp" }, { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:title", content: "Outstand | Peak Performance & Habit Intelligence" }, { name: "twitter:description", content: "Master your habits, maintain high-velocity streaks, and optimize your focus baselines." }, { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/MbFMKUuM2TWHnUX1cvLR8J9s9Jf1/social-images/social-1783582818919-1000035610.webp" },
  ], links: [
    { rel: "stylesheet", href: appCss }, { rel: "stylesheet", href: "/premium-ui.css" }, { rel: "stylesheet", href: "/performance.css" }, { rel: "manifest", href: "/manifest.json" }, { rel: "apple-touch-icon", href: "/outstand-logo.png" }, { rel: "icon", type: "image/png", href: "/outstand-logo.png" }, { rel: "preconnect", href: "https://fonts.googleapis.com" }, { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" }, { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap" },
  ] }),
  shellComponent: RootShell, component: RootComponent, notFoundComponent: NotFoundComponent, errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) { return <html lang="en" className="dark bg-[#05070d] text-slate-100 antialiased"><head><HeadContent /></head><body className="min-h-screen bg-[#05070d] text-slate-100 selection:bg-cyan-300/20">{children}<Scripts /></body></html>; }

function RootComponent() { const { queryClient } = Route.useRouteContext(); const { pathname } = useLocation(); const isPublicExperience = pathname === "/" || pathname === "/roadmap" || pathname.startsWith("/auth") || pathname.startsWith("/onboarding"); return <QueryClientProvider client={queryClient}>{isPublicExperience ? <AppShell /> : <SidebarLayout><AppShell /></SidebarLayout>}<Toaster /><QuickActions /></QueryClientProvider>; }
