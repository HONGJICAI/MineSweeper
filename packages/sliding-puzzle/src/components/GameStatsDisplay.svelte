<script lang="ts">
    import { EmojiBtn } from "@caiji-games/shared-ui";
    import type { GameStats } from "@caiji-games/sliding-puzzle-core";

    let {
        stats,
        onNewGame,
        onResetGame,
    }: {
        stats: GameStats;
        onNewGame?: () => void;
        onResetGame?: () => void;
    } = $props();
</script>

<div class="flex gap-6 rounded-[10px] p-6 min-w-[200px] justify-center items-center">
    <div class="flex justify-between items-center">
        <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.moves}</div>
        <div class="font-medium text-gray-600 dark:text-gray-400">👣</div>
    </div>
    <div class="flex gap-2 items-center">
        <EmojiBtn
            emoji={stats.isCompleted ? "▶️" : "🔄"}
            onclick={onNewGame}
            title="Start"
            ariaLabel="Start"
        />
        <EmojiBtn
            emoji="⏹️"
            onclick={onResetGame}
            title="Reset"
            ariaLabel="Reset"
            disabled={stats.isCompleted}
        />
    </div>
    <div class="flex justify-between items-center">
        <div class="font-medium text-gray-600 dark:text-gray-400">⏰</div>
        <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {Math.round(stats.time / 1000)}s
        </div>
    </div>
</div>
