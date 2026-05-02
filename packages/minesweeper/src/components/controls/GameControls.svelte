<script lang="ts">
    import type { Difficulty } from "@caiji-games/minesweeper-core";
    import Button from "../ui/Button.svelte";
    import { setWindowSize } from "../../lib/platform";

    let {
        difficulty,
        setDifficulty,
        mobileMode,
        setMobileMode,
        timer,
        minesLeft,
        faceEmoji,
        seed,
        onReset,
        onShowStats,
    }: {
        difficulty: Difficulty;
        setDifficulty: (d: Difficulty) => void;
        mobileMode: "reveal" | "flag";
        setMobileMode: (m: "reveal" | "flag") => void;
        timer: number;
        minesLeft: number;
        faceEmoji: string;
        seed: string;
        onReset: () => void;
        onShowStats: () => void;
    } = $props();

    async function pickEasy() {
        await setWindowSize(420, 480 + 32);
        setDifficulty("easy");
    }
    async function pickMedium() {
        await setWindowSize(660, 750);
        setDifficulty("medium");
    }
    async function pickHard() {
        await setWindowSize(1140, 750);
        setDifficulty("hard");
    }

    let mobileToggleHidden = $derived(
        difficulty === "easy"
            ? "easyFull:hidden"
            : difficulty === "medium"
                ? "mediumFull:hidden"
                : "hardFull:hidden"
    );
</script>

<!-- Difficulty + stats -->
<div class="flex gap-2 mb-2">
    <Button onclick={pickEasy} active={difficulty === "easy"}>🥉</Button>
    <Button onclick={pickMedium} active={difficulty === "medium"}>🥈</Button>
    <Button onclick={pickHard} active={difficulty === "hard"}>🥇</Button>
    <Button onclick={onShowStats}>📊</Button>
</div>

<!-- Mobile mode toggle -->
<div class="{mobileToggleHidden} mb-2 flex gap-2 justify-center">
    <Button onclick={() => setMobileMode("reveal")} active={mobileMode === "reveal"}>⛏️</Button>
    <Button onclick={() => setMobileMode("flag")} active={mobileMode === "flag"}>🚩</Button>
</div>

<!-- Timer / face / mines -->
<div class="flex gap-4 items-center mb-2">
    <div class="flex items-center gap-2 min-w-[80px]">
        <span class="text-gray-800 dark:text-gray-200 font-semibold">⏰</span>
        <span class="text-gray-800 dark:text-gray-200 font-semibold font-mono w-12 text-right">
            {timer}s
        </span>
    </div>
    <Button onclick={onReset} class="px-2 py-2">
        {faceEmoji}
    </Button>
    <div class="flex items-center gap-2 min-w-[80px]">
        <span class="text-gray-800 dark:text-gray-200 font-semibold">💣</span>
        <span class="text-gray-800 dark:text-gray-200 font-semibold font-mono w-12">
            {minesLeft}
        </span>
    </div>
</div>

<!-- Seed display -->
<div class="flex items-center gap-2 mb-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
    <span class="text-xs text-gray-600 dark:text-gray-400">Seed:</span>
    <code class="text-xs font-mono text-gray-800 dark:text-gray-200">{seed || "—"}</code>
</div>
