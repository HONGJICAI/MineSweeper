<script lang="ts">
    import type { Difficulty } from "@caiji-games/minesweeper-core";
    import type { Leaderboards } from "../state/leaderboard.svelte";
    import type { PlayHistoryMap } from "../state/playHistory.svelte";
    import { Button } from "@caiji-games/shared-ui";

    let {
        leaderboards,
        history,
        onPick,
        onShowStats,
    }: {
        leaderboards: Leaderboards;
        history: PlayHistoryMap;
        onPick: (d: Difficulty) => void;
        onShowStats: () => void;
    } = $props();

    type Card = {
        d: Difficulty;
        emoji: string;
        label: string;
        dimensions: string;
    };

    const cards: Card[] = [
        { d: "easy", emoji: "🥉", label: "Easy", dimensions: "9 × 9 · 10 mines" },
        { d: "medium", emoji: "🥈", label: "Medium", dimensions: "16 × 16 · 40 mines" },
        { d: "hard", emoji: "🥇", label: "Hard", dimensions: "16 × 30 · 99 mines" },
    ];

    function bestTime(d: Difficulty): number | undefined {
        return leaderboards[d]?.[0]?.time;
    }
    function gamesPlayed(d: Difficulty): number {
        return history[d]?.length ?? 0;
    }
</script>

<main class="flex flex-col items-center justify-center gap-6 p-6 min-h-dvh bg-white dark:bg-gray-900">
    <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100">MineSweeper</h1>

    <div class="w-full max-w-sm flex flex-col gap-3">
        {#each cards as card (card.d)}
            <button
                type="button"
                onclick={() => onPick(card.d)}
                class="w-full flex items-center gap-4 p-4 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:bg-gray-300 dark:active:bg-gray-600 transition-colors text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <span class="text-4xl">{card.emoji}</span>
                <div class="flex-1 text-left">
                    <div class="text-xl font-semibold">{card.label}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{card.dimensions}</div>
                </div>
                <div class="text-right">
                    {#if bestTime(card.d) !== undefined}
                        <div class="font-medium font-mono text-base">{bestTime(card.d)}s</div>
                    {:else}
                        <div class="font-mono text-gray-400 dark:text-gray-500">—</div>
                    {/if}
                    <div class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {gamesPlayed(card.d)} games
                    </div>
                </div>
            </button>
        {/each}
    </div>

    <Button variant="ghost" onclick={onShowStats}>📊 Statistics</Button>
</main>
