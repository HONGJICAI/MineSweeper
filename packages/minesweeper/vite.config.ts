import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const host = process.env.TAURI_DEV_HOST;
const isWeb = process.env.VITE_PLATFORM === "web";

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
                        name: "MineSweeper",
                        short_name: "MineSweeper",
                        description: "Classic Minesweeper game",
                        theme_color: "#ffffff",
                        background_color: "#ffffff",
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
    server: {
        port: 5173,
        strictPort: true,
        host: host || false,
        // For `tauri android dev`, HMR has to point back at the LAN IP tauri injects via
        // TAURI_DEV_HOST (the device can't reach localhost on the dev machine).
        hmr: host
            ? {
                  protocol: "ws",
                  host,
                  port: 5174,
              }
            : undefined,
        watch: {
            ignored: ["**/src-tauri/**"],
        },
        open: false,
    },
    envPrefix: ["VITE_", "TAURI_ENV_*"],
});
