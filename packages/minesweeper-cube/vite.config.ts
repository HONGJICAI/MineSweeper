import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const host = process.env.TAURI_DEV_HOST;

// Tauri builds (desktop / mobile) skip the PWA service worker — the app is bundled natively,
// and a registered SW conflicts with tauri's asset protocol on first launch.
const platform = process.env.VITE_PLATFORM ?? "web";
const isWeb = platform === "web";

export default defineConfig({
    plugins: [
        svelte(),
        tailwindcss(),
        ...(isWeb
            ? [
                  VitePWA({
                      registerType: "autoUpdate",
                      includeAssets: ["favicon.ico", "apple-touch-icon.png"],
                      manifest: {
                          name: "Minesweeper Cube",
                          short_name: "MS Cube",
                          description: "Minesweeper on a 3D cube — sweep all six faces.",
                          theme_color: "#0f172a",
                          background_color: "#0f172a",
                          display: "fullscreen",
                          display_override: ["fullscreen", "standalone"],
                          orientation: "any",
                          start_url: "/",
                          scope: "/",
                          icons: [
                              { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
                              { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
                          ],
                      },
                  }),
              ]
            : []),
    ],
    publicDir: "public",
    build: {
        outDir: "dist",
        sourcemap: true,
    },
    clearScreen: false,
    server: {
        port: 5182,
        strictPort: true,
        host: host || "0.0.0.0",
        // For `tauri android dev` the dev server must be reachable from the device — TAURI_DEV_HOST
        // is the LAN IP tauri injects. The HMR websocket then has to point back at that same host.
        hmr: host
            ? {
                  protocol: "ws",
                  host,
                  port: 5183,
              }
            : undefined,
        watch: {
            ignored: ["**/src-tauri/**"],
        },
        open: false,
    },
    envPrefix: ["VITE_", "TAURI_ENV_*"],
});
