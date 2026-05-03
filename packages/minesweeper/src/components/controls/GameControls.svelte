<script lang="ts">
    import type { Difficulty } from "@caiji-games/minesweeper-core";
    import { Button } from "@caiji-games/shared-ui";
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
</script>

<!-- Difficulty + stats — hidden when primary input is touch (lobby owns this row). -->
<div class="hidden pointer-fine:flex gap-2 mb-2">
    <Button onclick={pickEasy} active={difficulty === "easy"}>🥉</Button>
    <Button onclick={pickMedium} active={difficulty === "medium"}>🥈</Button>
    <Button onclick={pickHard} active={difficulty === "hard"}>🥇</Button>
    <Button onclick={onShowStats}>📊</Button>
</div>

<!-- Touch-only: mode toggle for tap-to-flag (right-click isn't available on touch) -->
<div class="hidden any-pointer-coarse:flex mb-2 gap-2 justify-center">
    <Button onclick={() => setMobileMode("reveal")} active={mobileMode === "reveal"}>⛏️</Button>
    <Button onclick={() => setMobileMode("flag")} active={mobileMode === "flag"}>🚩</Button>
</div>

<!-- Timer / face / mines: emojis anchor near the face button, numbers expand outward
     so the emojis don't drift when digit count changes. -->
<div class="flex gap-4 items-center mb-2">
    <div class="flex items-center gap-1 min-w-[80px] justify-end text-gray-800 dark:text-gray-200">
        <span class="font-medium font-mono">{timer}s</span>
        <span>⏰</span>
    </div>
    <Button onclick={onReset} class="px-2 py-2">
        {faceEmoji}
    </Button>
    <div class="flex items-center gap-1 min-w-[80px] justify-start text-gray-800 dark:text-gray-200">
        <span>💣</span>
        <span class="font-medium font-mono">{minesLeft}</span>
    </div>
</div>

<!-- Seed display -->
<div class="flex items-center gap-2 mb-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
    <span class="text-xs text-gray-600 dark:text-gray-400">Seed:</span>
    <code class="text-xs font-mono text-gray-800 dark:text-gray-200">{seed || "—"}</code>
</div>
