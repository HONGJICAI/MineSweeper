<script lang="ts">
    import type { Difficulty } from "@caiji-games/minesweeper-cube-core";
    import type { LeaderboardState } from "../state/leaderboard.svelte.ts";
    import type { PlayHistoryState } from "../state/playHistory.svelte.ts";
    import type { EndlessHistoryState } from "../state/endlessHistory.svelte.ts";
    import type { CubeHistoryEntry } from "../state/historyTypes.ts";

    type Props = {
        leaderboard: LeaderboardState;
        history: PlayHistoryState;
        endlessHistory: EndlessHistoryState;
        onClose: () => void;
    };
    let { leaderboard, history, endlessHistory, onClose }: Props = $props();

    type TabKey = Difficulty | "endless";

    const TABS: Array<{ key: TabKey; emoji: string; label: string }> = [
        { key: "easy",    emoji: "🌱", label: "Easy" },
        { key: "medium",  emoji: "🔥", label: "Medium" },
        { key: "hard",    emoji: "💀", label: "Hard" },
        { key: "endless", emoji: "♾️", label: "Endless" },
    ];

    let active = $state<TabKey>("easy");

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

    // Classic boards are keyed by Difficulty. Endless tab uses a separate state shape.
    let board = $derived<CubeHistoryEntry[]>(
        active === "endless" ? [] : (leaderboard.boards[active] ?? []),
    );
    let recent = $derived<CubeHistoryEntry[]>(
        active === "endless" ? [] : (history.map[active] ?? []),
    );

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

        <div class="flex border-b border-slate-800 px-2 pt-2">
            {#each TABS as t}
                <button
                    type="button"
                    class="flex flex-1 items-center justify-center gap-1.5 rounded-t-lg px-3 py-1.5 text-sm transition-colors {active === t.key ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'}"
                    onclick={() => (active = t.key)}
                    aria-pressed={active === t.key}
                    aria-label={t.label}
                >
                    <span aria-hidden="true">{t.emoji}</span>
                    <span>{t.label}</span>
                </button>
            {/each}
        </div>

        <div class="max-h-[60vh] overflow-y-auto px-4 py-4">
            {#if active === "endless"}
                <section class="mb-4">
                    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Best Runs (Top 5)</h3>
                    {#if endlessHistory.topByLevel.length === 0}
                        <p class="rounded bg-slate-800/40 px-3 py-2 text-sm text-slate-500">No runs yet.</p>
                    {:else}
                        <ol class="divide-y divide-slate-800 rounded bg-slate-800/40">
                            {#each endlessHistory.topByLevel as run, i}
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
                    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent ({endlessHistory.recent.length})</h3>
                    {#if endlessHistory.recent.length === 0}
                        <p class="rounded bg-slate-800/40 px-3 py-2 text-sm text-slate-500">No runs played.</p>
                    {:else}
                        <ul class="divide-y divide-slate-800 rounded bg-slate-800/40">
                            {#each endlessHistory.recent as run}
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
            {:else}
                <section class="mb-4">
                    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Best Times (Top 5)</h3>
                    {#if board.length === 0}
                        <p class="rounded bg-slate-800/40 px-3 py-2 text-sm text-slate-500">No wins yet.</p>
                    {:else}
                        <ol class="divide-y divide-slate-800 rounded bg-slate-800/40">
                            {#each board as entry, i}
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
                    <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent ({recent.length})</h3>
                    {#if recent.length === 0}
                        <p class="rounded bg-slate-800/40 px-3 py-2 text-sm text-slate-500">No games played.</p>
                    {:else}
                        <ul class="divide-y divide-slate-800 rounded bg-slate-800/40">
                            {#each recent as entry}
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
            {/if}
        </div>

        <footer class="flex justify-end gap-2 border-t border-slate-800 px-4 py-3">
            {#if active === "endless"}
                <button
                    type="button"
                    class="rounded bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
                    onclick={() => confirmClear("endless runs", endlessHistory.clear)}
                >
                    Clear endless runs
                </button>
            {:else}
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
            {/if}
        </footer>
    </div>
</div>
