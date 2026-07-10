# Vercel deployment

This project is a TanStack Start app, so Vercel must build the server output instead of treating it as a static Vite SPA.

## Build settings

Vercel reads `vercel.json` from this repository:

- Install command: `bun install`
- Build command: `bun run build:vercel`
- Framework preset: Other / disabled

The Vercel build generates its own catch-all route to the server renderer, which is what makes `/auth`, `/dopamine`, `/focus`, and refreshes on protected pages work.

## Required environment variables

Set these in Vercel for Production, Preview, and Development:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

The `VITE_` values are compiled into the browser bundle for Supabase Auth. The non-`VITE_` values are available to server-rendered code and server functions.

Do not add or expose the service-role key in Vercel for client-side code.

## Auth redirects

Add your deployed Vercel domain to the backend Auth redirect allow-list, including:

- `https://your-vercel-domain.vercel.app`
- `https://your-vercel-domain.vercel.app/*`

If you later attach a custom domain, add that domain and wildcard too.