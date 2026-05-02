<script lang="ts">
    import type { PlayHistory, Position, UserActionDetail } from "@caiji-games/minesweeper-core";
    import Button from "../ui/Button.svelte";

    let {
        playHistory,
        onRetry,
        onReplay,
    }: {
        playHistory: PlayHistory[];
        onRetry: (seed: string, firstStep: Position) => void;
        onReplay: (seed: string, actions: UserActionDetail[]) => void;
    } = $props();

    let expandedIndex = $state<number | null>(0);

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
</script>

<ul class="space-y-1 overflow-y-auto rounded h-full scrollbar-hide">
    {#if playHistory.length === 0}
        <li class="flex items-center justify-center h-full">
            <div class="text-center p-8">
                <div class="text-6xl mb-4 opacity-20">🎮</div>
                <p class="text-gray-600 dark:text-gray-400 font-medium mb-2">No games played yet</p>
                <p class="text-gray-400 dark:text-gray-500 text-sm">Start a new game to see your history here</p>
            </div>
        </li>
    {:else}
        {#each playHistory as entry, idx (idx)}
            <li class="border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded transition-all">
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    onclick={() => toggle(idx)}
                    class="grid grid-cols-[max-content_max-content_1fr] gap-2 text-sm items-center text-gray-900 dark:text-gray-100 p-2 cursor-pointer"
                >
                    <span
                        class="font-semibold min-w-[4ch] {entry.result === 'Win' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}"
                        title={entry.result}
                    >
                        {entry.result}
                    </span>
                    <span class="text-right break-words font-mono">
                        {entry.time}s
                        {#if entry.date}<span class="text-gray-500 dark:text-gray-400">({entry.date})</span>{/if}
                    </span>
                </div>
                {#if expandedIndex === idx}
                    <div class="p-2 pt-0">
                        <div class="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">
                            Seed: {entry.seed || "N/A"}
                        </div>
                        <div class="flex gap-2 justify-center">
                            <Button variant="ghost" title="Retry game" onclick={() => retry(entry)}>🔄</Button>
                            <Button variant="ghost" title="Replay your actions" onclick={() => replay(entry)}>▶️</Button>
                        </div>
                    </div>
                {/if}
            </li>
        {/each}
    {/if}
</ul>
