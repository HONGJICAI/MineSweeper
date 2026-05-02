<script lang="ts">
    import type { Difficulty } from "@caiji-games/minesweeper-core";
    import { Button, Modal } from "@caiji-games/shared-ui";
    import ConfirmDialog from "./ConfirmDialog.svelte";
    import { DifficultyText } from "../../types";
    import type { PlayHistoryMap } from "../../state/playHistory.svelte";

    let {
        show,
        onClose,
        playHistoryMap,
        onClearHistory,
        onClearLeaderboard,
    }: {
        show: boolean;
        onClose: () => void;
        playHistoryMap: PlayHistoryMap;
        onClearHistory?: () => void;
        onClearLeaderboard?: () => void;
    } = $props();

    let confirmAction = $state<"history" | "leaderboard" | null>(null);

    type Stats = { wins: number; total: number; rate: number };
    let stats = $derived.by((): Record<Difficulty, Stats> => {
        const out: Record<Difficulty, Stats> = {
            easy: { wins: 0, total: 0, rate: 0 },
            medium: { wins: 0, total: 0, rate: 0 },
            hard: { wins: 0, total: 0, rate: 0 },
        };
        for (const d of ["easy", "medium", "hard"] as Difficulty[]) {
            const history = playHistoryMap[d] ?? [];
            out[d].total = history.length;
            out[d].wins = history.filter(e => e.result === "Win").length;
            if (out[d].total > 0) {
                out[d].rate = Math.round((out[d].wins / out[d].total) * 100);
            }
        }
        return out;
    });

    function doConfirm() {
        if (confirmAction === "history") onClearHistory?.();
        else if (confirmAction === "leaderboard") onClearLeaderboard?.();
        confirmAction = null;
    }
</script>

<Modal {show} {onClose} title="Game Statistics">
    <div class="mb-6 grid grid-cols-3 gap-4">
        {#each ["easy", "medium", "hard"] as Difficulty[] as d (d)}
            <div class="text-center">
                <div class="text-2xl mb-1">{DifficultyText[d]}</div>
                <p class="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100">
                    {stats[d].rate}%
                </p>
                <p class="text-xs font-mono text-gray-500 dark:text-gray-500">
                    {stats[d].wins}/{stats[d].total}
                </p>
            </div>
        {/each}
    </div>

    <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-wrap">
        {#if onClearHistory}
            <Button variant="danger" size="sm" onclick={() => (confirmAction = "history")}>
                Clear Game History
            </Button>
        {/if}
        {#if onClearLeaderboard}
            <Button variant="danger" size="sm" onclick={() => (confirmAction = "leaderboard")}>
                Clear Leaderboard
            </Button>
        {/if}
    </div>

    {#if confirmAction}
        <ConfirmDialog
            title="Clear {confirmAction === 'history' ? 'History' : 'Leaderboard'}?"
            message="Are you sure? This action cannot be undone."
            confirmLabel="Clear"
            onConfirm={doConfirm}
            onCancel={() => (confirmAction = null)}
        />
    {/if}
</Modal>
