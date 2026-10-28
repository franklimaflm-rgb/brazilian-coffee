import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// Public backend settings (URL + publishable key are safe to ship to the browser).
// Used only when the build environment has no .env, so the live site never boots
// without a backend connection ("supabaseUrl is required").
const BACKEND_FALLBACK: Record<string, string> = {
  VITE_SUPABASE_URL: "https://jzqymlazswolzsoffpgi.supabase.co",
  VITE_SUPABASE_PROJECT_ID: "jzqymlazswolzsoffpgi",
  VITE_SUPABASE_PUBLISHABLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6cXltbGF6c3dvbHpzb2ZmcGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NzQ1NTUsImV4cCI6MjA3ODE1MDU1NX0.X8z6wdrlV3aNWlmhdWieT_ZbAcYQwRoZSYn6RgM9Sws",
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const define = Object.fromEntries(
    Object.entries(BACKEND_FALLBACK).map(([key, fallback]) => [
      `import.meta.env.${key}`,
      JSON.stringify(env[key] || process.env[key] || fallback),
    ]),
  );

  return {
    server: {
      host: "::",
      port: 8080,
    },
    define,
    plugins: [
      react(),
      mcpPlugin(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
