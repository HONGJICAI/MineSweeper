import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const host = process.env.TAURI_DEV_HOST;
const platform = process.env.VITE_PLATFORM;
const isWeb = platform === "web";

// Printed on every build because the platform decides which ads implementation gets bundled, and
// getting it wrong is silent: a desktop/Steam build must never carry the AdMob code, and an
// Android build that falls back to the desktop bundle would ship with no ads at all. The value
// comes from the calling script (see package.json) and flows through tauri's beforeBuildCommand,
// which is deliberately platform-neutral (`pnpm run build`).
// Pick the ads implementation at build time. AdMob is Android-only, and this app also ships to
// Steam and the Microsoft Store -- those builds get the no-op stub, which keeps the plugin's JS
// out of the bundle entirely. Mirrors the Rust side, where the plugin is an android-only
// dependency (src-tauri/Cargo.toml).
const hasAds = platform === "mobile";
const here = path.dirname(fileURLToPath(import.meta.url));
const adsImpl = hasAds
    ? path.resolve(here, "src/state/ads.svelte.ts")
    : path.resolve(here, "src/state/ads-noop.svelte.ts");

console.log(`[vite] VITE_PLATFORM=${platform ?? "(unset)"} -> ads: ${hasAds ? "admob" : "no-op"}`);

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
    resolve: {
        alias: {
            $ads: adsImpl,
        },
    },
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
