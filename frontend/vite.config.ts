import react from "@vitejs/plugin-react";
import federation from "@originjs/vite-plugin-federation";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "im_jankowiak_forgejo-paca",
      filename: "remoteEntry.js",
      exposes: {
        "./ForgejoSettingsTab": "./src/ForgejoSettingsTab.tsx",
        "./ForgejoTaskSection": "./src/ForgejoTaskSection.tsx",
      },
      shared: {
        react: { requiredVersion: "^19.0.0" },
        "react-dom": { requiredVersion: "^19.0.0" },
        "@tanstack/react-query": { requiredVersion: "^5.0.0" },
      },
    }),
  ],
  build: {
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
  },
});
