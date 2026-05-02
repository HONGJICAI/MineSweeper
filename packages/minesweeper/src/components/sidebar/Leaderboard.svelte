<script lang="ts">
    import type { Difficulty, PlayHistory, Position, UserActionDetail } from "@caiji-games/minesweeper-core";
    import { DifficultyText } from "../../types";

    let {
        boards,
        difficulty,
        onRetry,
        onReplay,
    }: {
        boards: Record<Difficulty, PlayHistory[]>;
        difficulty: Difficulty;
        onRetry: (seed: string, firstStep: Position) => void;
        onReplay: (seed: string, actions: UserActionDetail[]) => void;
    } = $props();

    let expandedIndex = $state<number | null>(null);

    function toggle(idx: number) {
        expandedIndex = expandedIndex === idx ? null : idx;
    }

    function retry(entry: PlayHistory) {
        const firstStep = entry.actions[0]?.position;
        if (!firstStep) {
            console.warn("No first step available for retry.");
            return;
        }
        onRetry(entry.seed, firstStep);
    }

    function replay(entry: PlayHistory) {
        onReplay(entry.seed, entry.actions);
    }

    let entries = $derived(boards[difficulty] ?? []);
</script>

<div class="w-full min-w-[220px]">
    <h2 class="text-md font-semibold mb-2 text-gray-900 dark:text-gray-100">
        {DifficultyText[difficulty]} Leaderboard
    </h2>
    <ol class="rounded">
        {#if entries.length === 0}
            <li class="text-gray-500">No entries yet.</li>
        {:else}
            {#each entries as entry, idx (idx)}
                <li class="border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded transition-all">
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div
                        onclick={() => toggle(idx)}
                        class="flex justify-between dark:text-gray-300 p-2 cursor-pointer dark:hover:bg-gray-800 rounded transition-colors"
                    >
                        <span class="font-medium font-mono">{entry.time}s</span>
                        <span class="text-xs text-gray-400 ml-2">{entry.date}</span>
                    </div>
                    {#if expandedIndex === idx}
                        <div class="p-2 pt-0">
                            <div class="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">
                                Seed: {entry.seed || "N/A"}
                            </div>
                            <div class="flex gap-2 justify-center">
                                <button
                                    type="button"
                                    class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                    title="Retry game"
                                    onclick={() => retry(entry)}
                                >🔄</button>
                                <button
                                    type="button"
                                    class="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                    title="Replay"
                                    onclick={() => replay(entry)}
                                >▶️</button>
                            </div>
                        </div>
                    {/if}
                </li>
            {/each}
        {/if}
    </ol>
</div>
