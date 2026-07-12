import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      
      // 1. Core SEO (Tells Google exactly who you are)
      { title: "Outstand by Arsh | Focus & Momentum Tracker" },
      { name: "description", content: "Outstand by Arsh is a premium habit tracker for students. Build streaks, master your focus with Pomodoro, and take on daily challenges." },
      { name: "author", content: "Arsh" },
      
      // 2. Open Graph (The "Social Billboard" for WhatsApp, Discord, LinkedIn)
      { property: "og:site_name", content: "Outstand by Arsh" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://outstand-by-arsh.vercel.app" }, // Update this if you get a custom domain!
      { property: "og:title", content: "Outstand by Arsh | Focus & Momentum Tracker" },
      { property: "og:description", content: "Outstand by Arsh is a premium habit tracker for students. Build streaks, master your focus, and take on daily challenges." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/MbFMKUuM2TWHnUX1cvLR8J9s9Jf1/social-images/social-1783582818919-1000035610.webp" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      
      // 3. Twitter Cards (For sharing on X/Twitter)
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Outstand by Arsh | Focus & Momentum Tracker" },
      { name: "twitter:description", content: "Build your momentum and master your focus. Check out Outstand by Arsh." },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/MbFMKUuM2TWHnUX1cvLR8J9s9Jf1/social-images/social-1783582818919-1000035610.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/outstand-logo.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;700&display=swap",
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
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
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
      <AppShell />
      <Toaster />
    </QueryClientProvider>
  );
    }
