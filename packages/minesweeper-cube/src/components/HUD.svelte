<script lang="ts">
    import { GameStatus, type Difficulty } from "@caiji-games/minesweeper-cube-core";
    import type { GameState } from "../state/game.svelte.ts";
    import type { TimerState } from "@caiji-games/shared-state";
    import type { MobileMode } from "../state/mobileMode.ts";

    type Props = {
        game: GameState;
        timer: TimerState;
        isPrimaryTouch: boolean;
        mobileMode: MobileMode;
        setMobileMode: (m: MobileMode) => void;
        onShowStats: () => void;
    };
    let { game, timer, isPrimaryTouch, mobileMode, setMobileMode, onShowStats }: Props = $props();

    function formatTime(s: number): string {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
    }

    const DIFFICULTIES: Array<{ key: Difficulty; emoji: string; label: string; spec: string }> = [
        { key: "easy",   emoji: "🌱", label: "Easy",   spec: "5×5×6, 22 mines" },
        { key: "medium", emoji: "🔥", label: "Medium", spec: "7×7×6, 47 mines" },
        { key: "hard",   emoji: "💀", label: "Hard",   spec: "9×9×6, 97 mines" },
    ];

    const statusText = $derived.by(() => {
        switch (game.status) {
            case GameStatus.Init: return isPrimaryTouch ? "Tap any cell to start" : "Click any cell to start";
            case GameStatus.Gaming: return "In progress";
            case GameStatus.GameOver: return "💥 Game over";
            case GameStatus.Win: return "🎉 You win";
        }
    });

    const hintText = $derived(
        isPrimaryTouch
            ? "Drag to rotate · Pinch to zoom · Tap a number to chord"
            : "Drag to rotate · Click to reveal · Right-click or Shift+Click to flag · Click a number to chord"
    );
</script>

<div class="pointer-events-none fixed inset-x-0 top-0 z-10 flex flex-col items-center gap-2 p-3">
    <h1 class="text-lg font-semibold tracking-wide text-slate-100 drop-shadow sm:text-xl">Minesweeper Cube</h1>

    <div class="pointer-events-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl bg-slate-800/70 px-3 py-1.5 backdrop-blur-md sm:rounded-full">
        {#each DIFFICULTIES as d}
            <button
                type="button"
                class="flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors {game.difficulty === d.key ? 'bg-sky-500 text-white' : 'text-slate-200 hover:bg-slate-700/70'}"
                title="{d.label} — {d.spec}"
                aria-label={d.label}
                onclick={() => game.setDifficulty(d.key)}
            >
                <span aria-hidden="true">{d.emoji}</span>
                <span class="hidden sm:inline">{d.label}</span>
            </button>
        {/each}

        <div class="hidden h-5 w-px bg-slate-600 sm:block"></div>

        <div class="flex items-center gap-1 px-1 text-sm text-slate-200" title="Mines remaining (total minus flags)">
            <span>💣</span>
            <span class="tabular-nums">{game.minesLeft}</span>
        </div>

        <div class="flex items-center gap-1 px-1 text-sm text-slate-200" title="Time elapsed">
            <span>⏱️</span>
            <span class="tabular-nums">{formatTime(timer.seconds)}</span>
        </div>

        <button
            type="button"
            class="rounded-full bg-slate-700/80 px-3 py-1 text-sm text-slate-100 hover:bg-slate-600"
            onclick={() => game.reset()}
            title="Restart current difficulty"
        >
            Reset
        </button>

        <button
            type="button"
            class="rounded-full bg-slate-700/80 px-3 py-1 text-sm text-slate-100 hover:bg-slate-600"
            onclick={onShowStats}
            title="Best times and recent games"
            aria-label="Show stats"
        >
            📊
        </button>
    </div>

    {#if isPrimaryTouch}
        <div class="pointer-events-auto inline-flex rounded-full bg-slate-800/70 p-1 backdrop-blur-md" role="group" aria-label="Tap mode">
            <button
                type="button"
                class="rounded-full px-4 py-1.5 text-sm transition-colors {mobileMode === 'reveal' ? 'bg-sky-500 text-white' : 'text-slate-200'}"
                onclick={() => setMobileMode("reveal")}
                aria-pressed={mobileMode === "reveal"}
            >
                ⛏ Reveal
            </button>
            <button
                type="button"
                class="rounded-full px-4 py-1.5 text-sm transition-colors {mobileMode === 'flag' ? 'bg-amber-500 text-white' : 'text-slate-200'}"
                onclick={() => setMobileMode("flag")}
                aria-pressed={mobileMode === "flag"}
            >
                🚩 Flag
            </button>
        </div>
    {/if}

    <div class="pointer-events-none rounded-full bg-slate-900/50 px-3 py-1 text-xs text-slate-300 backdrop-blur">
        {statusText}
    </div>
</div>

<div class="pointer-events-none fixed inset-x-0 bottom-3 z-10 flex justify-center px-3">
    <div class="max-w-full rounded-full bg-slate-900/50 px-3 py-1 text-center text-xs text-slate-400 backdrop-blur">
        {hintText}
    </div>
</div>
