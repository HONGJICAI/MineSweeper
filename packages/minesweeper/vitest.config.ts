import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
    plugins: [svelte()],
    resolve: {
        // Force client-side resolution so vite-plugin-svelte compiles to client (with $effect
        // runtime) instead of SSR. Without this, vitest defaults to server consumer and runes
        // become no-ops.
        conditions: ["browser"],
    },
    test: {
        environment: "happy-dom",
        include: ["src/**/*.test.ts", "src/**/*.test.svelte.ts"],
        server: {
            deps: {
                inline: [/@caiji-games\//],
            },
        },
    },
});
