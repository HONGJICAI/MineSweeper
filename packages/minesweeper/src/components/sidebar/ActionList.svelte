<script lang="ts">
    import type { ActionType, Position, UserActionDetail } from "@caiji-games/minesweeper-core";

    let {
        actions,
        setHighlightedCell,
    }: {
        actions: UserActionDetail[];
        setHighlightedCell: (cell: Position | undefined) => void;
    } = $props();

    const actionEmoji: Record<ActionType, string> = {
        reveal: "⛏️",
        flag: "🚩",
        chord: "⚒️",
    };

    function colorFor(score: number): string {
        if (score > 0) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
        if (score < 0) return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
    }

    let reversed = $derived([...actions].reverse());
</script>

<ul class="bg-gray-50 dark:bg-gray-800 rounded overflow-y-auto p-1 h-full scrollbar-hide">
    {#if actions.length === 0}
        <li class="flex items-center justify-center h-full">
            <div class="text-center p-8">
                <div class="text-6xl mb-4 opacity-20">🎯</div>
                <p class="text-gray-600 dark:text-gray-400 font-medium mb-2">No actions yet</p>
                <p class="text-gray-400 dark:text-gray-500 text-sm">Your moves will appear here</p>
            </div>
        </li>
    {:else}
        {#each reversed as action, i (`${action.position.r}-${action.position.c}-${actions.length - i}`)}
            {@const idx = actions.length - i}
            <!-- svelte-ignore a11y_mouse_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <li
                onmouseenter={() => setHighlightedCell(action.position)}
                onmouseleave={() => setHighlightedCell(undefined)}
                class="animate-slide-down {colorFor(action.score)} rounded mb-1 px-2 py-1 cursor-pointer hover:scale-105 transition-transform flex items-center gap-2"
            >
                <span class="text-gray-600 dark:text-gray-400 font-mono text-xs min-w-[4ch] text-right">{idx}.</span>
                <span>{actionEmoji[action.type]}</span>
                <b>{action.position.r}</b>, <b>{action.position.c}</b>
            </li>
        {/each}
    {/if}
</ul>
