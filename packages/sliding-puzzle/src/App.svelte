<script lang="ts">
    import { DarkModeToggle } from "@caiji-games/shared-ui";
    import SlidingPuzzle from "./components/SlidingPuzzle.svelte";
    import type { GameMode } from "./types/game";

    let mode = $state<GameMode>("number");
</script>

<div class="antialiased bg-white dark:bg-gray-900 min-h-dvh">
    <DarkModeToggle />
    <SlidingPuzzle mode={mode} onModeChange={(m) => (mode = m)} />
</div>
