import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
  useLocation,
  useRouter,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Bot, Home, RefreshCw, ShieldAlert } from "lucide-react";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/app-shell";
import { QuickActions } from "@/components/global/QuickActions";
import { Toaster } from "@/components/ui/sonner";
import SidebarLayout from "@/components/layout/SidebarLayout";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen bg-background px-4 text-foreground">
      <div className="relative z-10 m-auto max-w-md rounded-[24px] border border-border bg-card p-8 text-center backdrop-blur-xl">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl border border-border bg-muted text-primary">
          <Bot className="h-6 w-6" />
        </div>
        <h1 className="text-5xl font-black tracking-[-0.05em]">404</h1>
        <h2 className="mt-3 text-base font-bold">Page not found</h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          This page doesn&apos;t exist or has moved.
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground transition hover:opacity-90"
        >
          <Home className="h-4 w-4" />
          Return home
        </Link>
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="max-w-md rounded-[24px] border border-rose-400/15 bg-card p-8 text-center backdrop-blur-xl">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-xl border border-rose-400/15 bg-rose-400/[0.05] text-rose-300">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-black">Something went wrong</h1>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          The page hit an unexpected error. Your saved data is safe.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5 text-xs font-bold text-foreground transition hover:bg-accent hover:text-accent-foreground"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#05070d" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "OUTSTAND" },
      { name: "application-name", content: "OUTSTAND" },
      { name: "format-detection", content: "telephone=no" },
      { title: "OUTSTAND — Your goals. Your system. Your momentum." },
      {
        name: "description",
        content:
          "OUTSTAND is a personal growth system for goals, habits, focus sessions, roadmaps, progress tracking and friends in one place.",
      },
      { name: "author", content: "OUTSTAND" },
      { property: "og:site_name", content: "OUTSTAND" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://outstand-by-arsh.vercel.app" },
      { property: "og:title", content: "OUTSTAND — Your goals. Your system. Your momentum." },
      {
        property: "og:description",
        content:
          "Goals, habits, focus sessions, roadmaps and social progress — built into one connected personal growth system.",
      },
      { property: "og:image", content: "https://outstand-by-arsh.vercel.app/outstand-logo.png" },
      { property: "og:image:alt", content: "OUTSTAND logo" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "OUTSTAND — Your goals. Your system. Your momentum." },
      {
        name: "twitter:description",
        content:
          "Goals, habits, focus sessions, roadmaps and social progress in one connected personal growth system.",
      },
      { name: "twitter:image", content: "https://outstand-by-arsh.vercel.app/outstand-logo.png" },
      { name: "twitter:image:alt", content: "OUTSTAND logo" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "/premium-ui.css" },
      { rel: "stylesheet", href: "/performance.css" },
      { rel: "stylesheet", href: "/editorial-ui.css" },
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
    <html lang="en" className="bg-background text-foreground antialiased">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background text-foreground selection:bg-blue-400/20">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { pathname } = useLocation();

  useEffect(() => {
    const applyTheme = () => {
      const theme = localStorage.getItem("outstand-theme") === "light" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.dataset.theme = theme;
      document.body.dataset.theme = theme;
    };

    applyTheme();
    window.addEventListener("storage", applyTheme);
    return () => window.removeEventListener("storage", applyTheme);
  }, []);

  const isPublicExperience =
    pathname === "/" ||
    pathname === "/roadmap" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding");

  return (
    <QueryClientProvider client={queryClient}>
      {isPublicExperience ? (
        <AppShell />
      ) : (
        <SidebarLayout>
          <AppShell />
        </SidebarLayout>
      )}
      <Toaster />
      <QuickActions />
    </QueryClientProvider>
  );
}
