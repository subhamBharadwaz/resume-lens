import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  security: {
    checkOrigin: false,
  },
  adapter: vercel({
    bodySizeLimit: 6 * 1024 * 1024,
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
