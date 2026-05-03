import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        svelte(),
        tailwindcss(),
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
        open: false,
    },
});
