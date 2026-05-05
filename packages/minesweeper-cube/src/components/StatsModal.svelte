<script lang="ts">
    import type { Difficulty, EndlessMode, Mode } from "@caiji-games/minesweeper-cube-core";
    import type { LeaderboardState } from "../state/leaderboard.svelte.ts";
    import type { PlayHistoryState } from "../state/playHistory.svelte.ts";
    import type { EndlessHistoryState } from "../state/endlessHistory.svelte.ts";

    type Props = {
        leaderboard: LeaderboardState;
        history: PlayHistoryState;
        endlessHistory: Record<EndlessMode, EndlessHistoryState>;
        onClose: () => void;
    };
    let { leaderboard, history, endlessHistory, onClose }: Props = $props();

    // Top-level mode tabs mirror the HUD hierarchy: pick a mode first, then a sub-tab inside.
    const MODE_TABS: Array<{ key: Mode; emoji: string; label: string }> = [
        { key: "classic", emoji: "⚡", label: "Quick" },
        { key: "endless", emoji: "♾️", label: "Endless" },
    ];

    const DIFFICULTY_TABS: Array<{ key: Difficulty; emoji: string; label: string }> = [
        { key: "easy",   emoji: "🌱", label: "Easy" },
        { key: "medium", emoji: "🔥", label: "Medium" },
        { key: "hard",   emoji: "💀", label: "Hard" },
    ];

    const ENDLESS_TABS: Array<{ key: EndlessMode; emoji: string; label: string }> = [
        { key: "normal", emoji: "🟦", label: "Normal" },
        { key: "voxel",  emoji: "🧊", label: "Voxel" },
    ];

    let activeMode = $state<Mode>("classic");
    let activeDifficulty = $state<Difficulty>("easy");
    let activeEndless = $state<EndlessMode>("normal");

    const activeBoard = $derived(activeMode === "classic" ? (leaderboard.boards[activeDifficulty] ?? []) : []);
    const activeRecent = $derived(activeMode === "classic" ? (history.map[activeDifficulty] ?? []) : []);
    const activeEndlessStore = $derived(endlessHistory[activeEndless]);

    function fmtTime(s: number): string {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
    }

    function fmtDate(iso: string): string {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso;
        return d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
    }

    function handleBackdrop(e: MouseEvent) {
        if (e.target === e.currentTarget) onClose();
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") onClose();
    }

    function confirmClear(label: string, action: () => void) {
        if (typeof window !== "undefined" && !window.confirm(`Clear ${label}? This cannot be undone.`)) return;
        action();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    onclick={handleBackdrop}
    role="presentation"
>
    <div class="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-slate-700">
        <header class="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <h2 class="text-base font-semibold text-slate-100">Stats</h2>
            <button
                type="button"
                class="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                onclick={onClose}
                aria-label="Close"
            >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </header>

        <!-- Top-level mode tabs. -->
        <div class="flex border-b border-slate-800 px-2 pt-2">
            {#each MODE_TABS as t}
                <button
                    type="button"
                    class="flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-3 py-1.5 text-sm transition-colors {activeMode === t.key ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'}"
                    onclick={() => (activeMode = t.key)}
                    aria-pressed={activeMode === t.key}
                >
                    <span aria-hidden="true">{t.emoji}</span>
                    <span>{t.label}</span>
                </button>
            {/each}
        </div>

        <div class="max-h-[60vh] overflow-y-auto px-4 py-4">
            <!-- Sub-tabs swap based on active mode. -->
            {#if activeMode === "classic"}
                <div class="mb-3 inline-flex rounded-full bg-slate-800/60 p-1">
                    {#each DIFFICULTY_TABS as d}
                        <button
                            type="button"
                            class="flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-colors {activeDifficulty === d.key ? 'bg-sky-500 text-white' : 'text-slate-300 hover:text-slate-100'}"
                            onclick={() => (activeDifficulty = d.key)}
                            aria-pressed={activeDifficulty === d.key}
                        >
                            <span aria-hidden="true">{d.emoji}</span>
                            <span>{d.label}</span>
                        </button>
                    {/each}
                </div>

                <section class="mb-4">
                    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Best Times (Top 5)</h3>
                    {#if activeBoard.length === 0}
                        <p class="rounded bg-slate-800/40 px-3 py-2 text-sm text-slate-500">No wins yet.</p>
                    {:else}
                        <ol class="divide-y divide-slate-800 rounded bg-slate-800/40">
                            {#each activeBoard as entry, i}
                                <li class="flex items-center justify-between px-3 py-1.5 text-sm">
                                    <span class="flex items-center gap-2 text-slate-200">
                                        <span class="w-5 text-right tabular-nums text-slate-500">{i + 1}.</span>
                                        <span class="tabular-nums">{fmtTime(entry.time)}</span>
                                    </span>
                                    <span class="text-xs text-slate-500">{fmtDate(entry.date)}</span>
                                </li>
                            {/each}
                        </ol>
                    {/if}
                </section>

                <section>
                    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent ({activeRecent.length})</h3>
                    {#if activeRecent.length === 0}
                        <p class="rounded bg-slate-800/40 px-3 py-2 text-sm text-slate-500">No games played.</p>
                    {:else}
                        <ul class="divide-y divide-slate-800 rounded bg-slate-800/40">
                            {#each activeRecent as entry}
                                <li class="flex items-center justify-between px-3 py-1.5 text-sm">
                                    <span class="flex items-center gap-2">
                                        <span class={entry.result === "Win" ? "text-emerald-400" : "text-rose-400"}>
                                            {entry.result === "Win" ? "✓" : "✗"}
                                        </span>
                                        <span class="tabular-nums text-slate-300">{fmtTime(entry.time)}</span>
                                    </span>
                                    <span class="text-xs text-slate-500">{fmtDate(entry.date)}</span>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </section>
            {:else}
                <div class="mb-3 inline-flex rounded-full bg-slate-800/60 p-1">
                    {#each ENDLESS_TABS as sm}
                        <button
                            type="button"
                            class="flex items-center gap-1 rounded-full px-3 py-1 text-xs transition-colors {activeEndless === sm.key ? 'bg-violet-500 text-white' : 'text-slate-300 hover:text-slate-100'}"
                            onclick={() => (activeEndless = sm.key)}
                            aria-pressed={activeEndless === sm.key}
                        >
                            <span aria-hidden="true">{sm.emoji}</span>
                            <span>{sm.label}</span>
                        </button>
                    {/each}
                </div>

                <section class="mb-4">
                    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Best Runs (Top 5)</h3>
                    {#if activeEndlessStore.topByLevel.length === 0}
                        <p class="rounded bg-slate-800/40 px-3 py-2 text-sm text-slate-500">No runs yet.</p>
                    {:else}
                        <ol class="divide-y divide-slate-800 rounded bg-slate-800/40">
                            {#each activeEndlessStore.topByLevel as run, i}
                                <li class="flex items-center justify-between px-3 py-1.5 text-sm">
                                    <span class="flex items-center gap-2 text-slate-200">
                                        <span class="w-5 text-right tabular-nums text-slate-500">{i + 1}.</span>
                                        <span class="tabular-nums">Lv {run.maxLevel}</span>
                                        <span class="tabular-nums text-xs text-slate-400">{fmtTime(run.time)}</span>
                                    </span>
                                    <span class="text-xs text-slate-500">{fmtDate(run.date)}</span>
                                </li>
                            {/each}
                        </ol>
                    {/if}
                </section>

                <section>
                    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent ({activeEndlessStore.recent.length})</h3>
                    {#if activeEndlessStore.recent.length === 0}
                        <p class="rounded bg-slate-800/40 px-3 py-2 text-sm text-slate-500">No runs played.</p>
                    {:else}
                        <ul class="divide-y divide-slate-800 rounded bg-slate-800/40">
                            {#each activeEndlessStore.recent as run}
                                <li class="flex items-center justify-between px-3 py-1.5 text-sm">
                                    <span class="flex items-center gap-2 text-slate-300">
                                        <span class="tabular-nums">Lv {run.maxLevel}</span>
                                        <span class="tabular-nums text-xs text-slate-400">{fmtTime(run.time)}</span>
                                    </span>
                                    <span class="text-xs text-slate-500">{fmtDate(run.date)}</span>
                                </li>
                            {/each}
                        </ul>
                    {/if}
                </section>
            {/if}
        </div>

        <footer class="flex justify-end gap-2 border-t border-slate-800 px-4 py-3">
            {#if activeMode === "classic"}
                <button
                    type="button"
                    class="rounded bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
                    onclick={() => confirmClear("leaderboard", leaderboard.clear)}
                >
                    Clear leaderboard
                </button>
                <button
                    type="button"
                    class="rounded bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
                    onclick={() => confirmClear("recent history", history.clear)}
                >
                    Clear history
                </button>
            {:else}
                <button
                    type="button"
                    class="rounded bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
                    onclick={() => confirmClear(`${activeEndless} endless runs`, activeEndlessStore.clear)}
                >
                    Clear {activeEndless} runs
                </button>
            {/if}
        </footer>
    </div>
</div>
