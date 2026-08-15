import { defineConfig, loadEnv } from "vite";
// Corrected import path and function name for TanStack Start
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // 1. Safely load environment variables based on the current environment mode
  const env = {
    ...loadEnv(mode, process.cwd(), ""),
    ...process.env,
  };

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || "";
  const supabasePublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || "";
  
  // 2. Handle Nitro Preset for Vercel deployments
  const nitroPreset = env.NITRO_PRESET || (env.VERCEL ? "vercel" : undefined);
  if (nitroPreset) {
    process.env.NITRO_PRESET = nitroPreset;
  }

  return {
    // 3. Register the required plugins for TanStack Start and Tailwind v4
    plugins: [
      // Updated function call
      tanstackStart({
        server: { 
          // Redirects TanStack Start's bundled server entry to your custom error wrapper
          entry: "server" 
        },
      }),
      tailwindcss(),
    ],
    // 4. Inject environment variables directly into standard Vite's 'define' at the root level
    define: {
      "process.env.SUPABASE_URL": JSON.stringify(supabaseUrl),
      "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
    },
  };
});
