<script lang="ts">
    import type { Difficulty, PlayHistory, Position, UserActionDetail } from "@caiji-games/minesweeper-core";
    import type { Leaderboards } from "../../state/leaderboard.svelte";
    import { Button } from "@caiji-games/shared-ui";
    import Leaderboard from "./Leaderboard.svelte";
    import ActionList from "./ActionList.svelte";
    import PlayHistoryList from "./PlayHistoryList.svelte";

    let {
        leaderboards,
        difficulty,
        userActions,
        playHistory,
        setHighlightedCell,
        onRetry,
        onReplay,
    }: {
        leaderboards: Leaderboards;
        difficulty: Difficulty;
        userActions: UserActionDetail[];
        playHistory: PlayHistory[];
        setHighlightedCell: (cell: Position | undefined) => void;
        onRetry: (seed: string, firstStep: Position) => void;
        onReplay: (seed: string, actions: UserActionDetail[]) => void;
    } = $props();

    let activeTab = $state<"actions" | "history">("actions");
    let isOpen = $state(false);

    function close() {
        isOpen = false;
    }

    function handleRetry(seed: string, firstStep: Position) {
        onRetry(seed, firstStep);
        close();
        activeTab = "actions";
    }
    function handleReplay(seed: string, actions: UserActionDetail[]) {
        onReplay(seed, actions);
        close();
        activeTab = "actions";
    }

    // Per-difficulty: hide drawer-mode UI above the matching breakpoint.
    let hiddenClass = $derived(
        difficulty === "easy"
            ? "easyFull:hidden"
            : difficulty === "medium"
                ? "mediumFull:hidden"
                : "hardFull:hidden"
    );

    let layoutClass = $derived(
        difficulty === "easy"
            ? "easyFull:relative easyFull:right-auto easyFull:top-auto easyFull:z-auto easyFull:translate-x-0 easyFull:shadow-none easyFull:h-[calc(100dvh-2rem)]"
            : difficulty === "medium"
                ? "mediumFull:relative mediumFull:right-auto mediumFull:top-auto mediumFull:z-auto mediumFull:translate-x-0 mediumFull:shadow-none mediumFull:h-[calc(100dvh-2rem)]"
                : "hardFull:relative hardFull:right-auto hardFull:top-auto hardFull:z-auto hardFull:translate-x-0 hardFull:shadow-none hardFull:h-[calc(100dvh-2rem)]"
    );
</script>

<!-- Mobile floating button -->
<Button
    variant="icon"
    onclick={() => (isOpen = true)}
    class="{hiddenClass} fixed top-4 right-4 z-50 shadow-lg"
    ariaLabel="Open sidebar"
>
    <div class="relative w-6 h-6 overflow-hidden">
        <div class="animate-slide-emoji absolute inset-0 flex flex-col">
            <span class="h-6 flex items-center justify-center">🏆</span>
            <span class="h-6 flex items-center justify-center">📋</span>
        </div>
    </div>
</Button>

<!-- Mobile backdrop -->
{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="{hiddenClass} fixed inset-0 bg-white/30 backdrop-blur-sm z-50"
        onclick={close}
    ></div>
{/if}

<!-- Sidebar -->
<div
    class="
        fixed right-0 top-0 z-50 h-dvh w-[250px]
        bg-gray-50 dark:bg-gray-800
        shadow-2xl
        transform transition-transform duration-300
        {isOpen ? 'translate-x-0' : 'translate-x-full'}
        p-4
        {layoutClass}
    "
>
    <!-- Mobile close button -->
    <Button
        variant="ghost"
        size="sm"
        onclick={close}
        class="{hiddenClass} absolute top-2 right-2"
        ariaLabel="Close sidebar"
    >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    </Button>

    <div class="grid grid-rows-[max-content_1fr] gap-0 h-full">
        <Leaderboard
            boards={leaderboards}
            {difficulty}
            onRetry={handleRetry}
            onReplay={handleReplay}
        />

        <div class="flex flex-col h-full overflow-hidden">
            <div class="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    type="button"
                    onclick={() => (activeTab = "actions")}
                    class="flex-1 px-4 py-2 text-sm font-medium transition-colors {activeTab === 'actions' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}"
                >🕹️Actions</button>
                <button
                    type="button"
                    onclick={() => (activeTab = "history")}
                    class="flex-1 px-4 py-2 text-sm font-medium transition-colors {activeTab === 'history' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}"
                >📜History</button>
            </div>

            <div class="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                {#if activeTab === "actions"}
                    <ActionList actions={userActions} {setHighlightedCell} />
                {:else}
                    <PlayHistoryList {playHistory} onRetry={handleRetry} onReplay={handleReplay} />
                {/if}
            </div>
        </div>
    </div>
</div>
