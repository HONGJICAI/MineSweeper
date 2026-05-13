<script lang="ts">
    import { GameStatus, type Difficulty, type EndlessMode, type Mode } from "@caiji-games/minesweeper-cube-core";
    import type { GameState } from "../state/game.svelte.ts";
    import type { TimerState } from "@caiji-games/shared-state";
    import type { MobileMode } from "../state/mobileMode.ts";
    import type { UnlockState } from "../state/unlocks.svelte.ts";
    import type { AdsState } from "$ads";

    type Props = {
        game: GameState;
        timer: TimerState;
        unlocks: UnlockState;
        ads: AdsState;
        isPrimaryTouch: boolean;
        mobileMode: MobileMode;
        setMobileMode: (m: MobileMode) => void;
        onShowStats: () => void;
        // Settings sheet visibility is lifted to App.svelte so the Android back-button handler
        // there can close it before letting the press bubble out to "exit app".
        showSettings: boolean;
        setShowSettings: (v: boolean) => void;
    };
    let {
        game, timer, unlocks, ads, isPrimaryTouch, mobileMode,
        setMobileMode, onShowStats, showSettings, setShowSettings,
    }: Props = $props();

    // Interstitial trigger disabled for v1 — too intrusive while the rest of the ad UX still
    // shakes out. The function `ads.maybeShowInterstitial()` is still exported so it can be
    // re-enabled here in one line later, or moved to a different trigger point.
    function handleReset() {
        game.reset();
    }

    // Unlock prerequisites for the locked tooltips. Easy is always unlocked.
    const UNLOCK_HINT: Record<Difficulty | "endless", string> = {
        easy:    "",
        medium:  "Win Easy first",
        hard:    "Win Medium first",
        endless: "Win Medium first",
    };

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

    const MODES: Array<{ key: Mode; emoji: string; label: string }> = [
        { key: "classic", emoji: "⚡", label: "Quick" },
        { key: "endless", emoji: "♾️", label: "Endless" },
    ];

    const ENDLESS_SUBMODES: Array<{ key: EndlessMode; emoji: string; label: string; title: string }> = [
        { key: "normal", emoji: "🟦", label: "Normal", title: "Hollow cube minesweeper, N grows each round" },
        { key: "voxel",  emoji: "🧊", label: "Voxel",  title: "Rubik-style 3D voxel cube" },
    ];

    // The "what am I playing right now" badge that lives in the main HUD bar. Clicking it opens
    // the Settings sheet — moves all the mode/difficulty selection out of the cluttered main bar.
    // For endless we show just the sub-mode; the level/round number lives in the status bubble
    // below, so showing "Lv X" here would duplicate it.
    const currentBadge = $derived.by(() => {
        if (game.mode === "classic") {
            const d = DIFFICULTIES.find(d => d.key === game.difficulty);
            return d ? { emoji: d.emoji, label: d.label } : { emoji: "⚡", label: "Quick" };
        }
        const sm = ENDLESS_SUBMODES.find(s => s.key === game.endlessMode);
        return { emoji: sm?.emoji ?? "♾️", label: sm?.label ?? "Endless" };
    });

    const statusText = $derived.by(() => {
        if (game.mode === "endless") {
            switch (game.status) {
                case GameStatus.Init:
                case GameStatus.Gaming:  return `Round ${game.level - 6} · ${game.N}×${game.N}×6, ${game.totalMines} mines`;
                case GameStatus.GameOver: return `Reached round ${game.level - 6} (N=${game.level})`;
                case GameStatus.Win:     return "";
            }
        }
        switch (game.status) {
            case GameStatus.Init:    return isPrimaryTouch ? "Tap any cell to start" : "Click any cell to start";
            case GameStatus.Gaming:  return "";
            case GameStatus.GameOver: return "";
            case GameStatus.Win:     return "🎉 You win";
        }
        return "";
    });

    const faceEmoji = $derived.by(() => {
        switch (game.status) {
            case GameStatus.GameOver: return "😢";
            case GameStatus.Win:     return "😎";
            default:                 return "😊";
        }
    });

    const hintText = $derived(
        isPrimaryTouch
            ? "Drag to rotate · Pinch to zoom · Tap a number to chord"
            : "Drag to rotate · Click to reveal · Right-click or Shift+Click to flag · Click a number to chord"
    );

    // Mobile-friendly cheat trigger: 7 taps on the ♾️ Endless button (within Settings) within a
    // 5-second window fires the same skip-level cheat as the desktop Konami code.
    const CHEAT_TAP_THRESHOLD = 7;
    const CHEAT_TAP_WINDOW_MS = 5000;
    let cheatTapCount = 0;
    let cheatFirstTapAt = 0;

    function handleModeClick(m: Mode) {
        // Endless is gated behind Medium being beaten — refuse the click so the user can't slip
        // into endless via the cheat-tap counter either.
        if (m === "endless" && !unlocks.endless) return;
        game.setMode(m);
        if (m !== "endless") {
            cheatTapCount = 0;
            return;
        }
        const now = Date.now();
        if (now - cheatFirstTapAt > CHEAT_TAP_WINDOW_MS) {
            cheatTapCount = 1;
            cheatFirstTapAt = now;
        } else {
            cheatTapCount += 1;
        }
        if (cheatTapCount >= CHEAT_TAP_THRESHOLD) {
            cheatTapCount = 0;
            game.cheatAdvanceLevel();
        }
    }

    function handleSettingsBackdrop(e: MouseEvent) {
        if (e.target === e.currentTarget) setShowSettings(false);
    }

    function handleSettingsKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && showSettings) setShowSettings(false);
    }

    // Picking a difficulty / sub-mode / tap-mode auto-closes the sheet — feels confident, the
    // shrink-grow animation is the player's visual confirmation that the setting was applied.
    function pickDifficulty(d: Difficulty) {
        if (!unlocks.isUnlocked(d)) return;
        game.setDifficulty(d);
        setShowSettings(false);
    }
    function pickEndlessMode(em: EndlessMode) {
        game.setEndlessMode(em);
        setShowSettings(false);
    }
    function toggleTapMode() {
        setMobileMode(mobileMode === "reveal" ? "flag" : "reveal");
    }
</script>

<svelte:window onkeydown={handleSettingsKeydown} />

<!-- Absolute (not fixed) so the HUD lives inside <main>, which shrinks above the banner spacer.
     pt uses max(safe-area, 0.75rem) so notch/punch-hole devices push the title down past the
     cutout while normal devices still get the regular 12px padding. -->
<div class="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-2 px-3 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
    <h1 class="text-lg font-semibold tracking-wide text-slate-100 drop-shadow sm:text-xl">Minesweeper Cube</h1>

    <!-- Slim main bar: only the "during play" essentials. Mode/difficulty/sub-mode selection
         lives in the Settings sheet, opened by tapping the current-state badge. -->
    <div class="pointer-events-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full bg-slate-800/70 px-2 py-1 backdrop-blur-md">
        <button
            type="button"
            class="flex items-center gap-1 rounded-full bg-slate-700/80 px-3 py-1 text-sm text-slate-100 hover:bg-slate-600"
            onclick={() => setShowSettings(true)}
            title="Mode / difficulty"
            aria-label="Open settings"
        >
            <span aria-hidden="true">{currentBadge.emoji}</span>
            <span>{currentBadge.label}</span>
            <span aria-hidden="true" class="text-slate-400">▾</span>
        </button>

        <div class="h-5 w-px bg-slate-600"></div>

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
            class="rounded-full bg-slate-700/80 px-2 py-0.5 text-lg leading-none text-slate-100 hover:bg-slate-600"
            onclick={handleReset}
            title="Restart"
            aria-label="Restart"
        >
            {faceEmoji}
        </button>
    </div>

    {#if statusText}
        <div class="pointer-events-none rounded-full bg-slate-900/50 px-3 py-1 text-xs text-slate-300 backdrop-blur">
            {statusText}
        </div>
    {/if}
</div>

<!-- Stats button: corner-pinned so it never competes for HUD-bar width. Without this, endless
     runs whose level + timer + mine count grow past the screen width force the main bar to
     wrap onto two lines. top/right use max(safe-area-inset, 0.75rem) so the button avoids
     notch/punch-hole/curved-edge regions on devices that report them. -->
<button
    type="button"
    class="pointer-events-auto absolute z-20 rounded-full bg-slate-700/80 px-3 py-1 text-sm text-slate-100 shadow hover:bg-slate-600 top-[max(env(safe-area-inset-top),0.75rem)] right-[max(env(safe-area-inset-right),0.75rem)]"
    onclick={onShowStats}
    title="Best times and recent games"
    aria-label="Show stats"
>
    📊
</button>

<div class="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
    <div class="max-w-full rounded-full bg-slate-900/50 px-3 py-1 text-center text-xs text-slate-400 backdrop-blur">
        {hintText}
    </div>
</div>

<!-- Settings sheet: mode + difficulty/sub-mode + (touch) tap mode. Picking auto-closes. -->
{#if showSettings}
    <div
        class="absolute inset-0 z-40 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        onclick={handleSettingsBackdrop}
        role="presentation"
    >
        <div class="flex w-full max-w-md flex-col gap-4 rounded-t-2xl bg-slate-900 p-5 shadow-2xl ring-1 ring-slate-700 sm:rounded-2xl">
            <header class="flex items-center justify-between">
                <h2 class="text-base font-semibold text-slate-100">Settings</h2>
                <button
                    type="button"
                    class="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    onclick={() => setShowSettings(false)}
                    aria-label="Close"
                >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>

            <section class="flex flex-col gap-2">
                <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</h3>
                <div class="grid grid-cols-2 gap-2">
                    {#each MODES as m}
                        {@const locked = m.key === "endless" && !unlocks.endless}
                        <button
                            type="button"
                            class="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors {locked ? 'cursor-not-allowed bg-slate-800/60 text-slate-500' : game.mode === m.key ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}"
                            disabled={locked}
                            title={locked ? UNLOCK_HINT.endless : ""}
                            onclick={() => handleModeClick(m.key)}
                        >
                            <span aria-hidden="true">{locked ? "🔒" : m.emoji}</span>
                            <span>{m.label}</span>
                        </button>
                    {/each}
                </div>
                {#if !unlocks.endless}
                    <p class="text-[10px] text-slate-500">Endless unlocks after winning Medium.</p>
                {/if}
            </section>

            {#if game.mode === "classic"}
                <section class="flex flex-col gap-2">
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Difficulty</h3>
                    <div class="grid grid-cols-3 gap-2">
                        {#each DIFFICULTIES as d}
                            {@const locked = !unlocks.isUnlocked(d.key)}
                            <button
                                type="button"
                                class="flex flex-col items-center gap-1 rounded-lg px-3 py-2.5 text-sm transition-colors {locked ? 'cursor-not-allowed bg-slate-800/60 text-slate-500' : game.difficulty === d.key ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}"
                                disabled={locked}
                                title={locked ? UNLOCK_HINT[d.key] : d.spec}
                                onclick={() => pickDifficulty(d.key)}
                            >
                                <span aria-hidden="true" class="text-base">{locked ? "🔒" : d.emoji}</span>
                                <span>{d.label}</span>
                                <span class="text-[10px] {locked ? 'text-slate-500' : game.difficulty === d.key ? 'text-sky-100' : 'text-slate-400'}">{locked ? UNLOCK_HINT[d.key] : d.spec}</span>
                            </button>
                        {/each}
                    </div>
                </section>
            {:else}
                <section class="flex flex-col gap-2">
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Sub-mode</h3>
                    <div class="grid grid-cols-2 gap-2">
                        {#each ENDLESS_SUBMODES as sm}
                            <button
                                type="button"
                                class="flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors {game.endlessMode === sm.key ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}"
                                title={sm.title}
                                onclick={() => pickEndlessMode(sm.key)}
                            >
                                <span aria-hidden="true">{sm.emoji}</span>
                                <span>{sm.label}</span>
                            </button>
                        {/each}
                    </div>
                    <p class="text-xs text-slate-400">
                        Round {game.level - 6} · {game.N}×{game.N}×6 · {game.totalMines} mines
                    </p>
                </section>
            {/if}

        </div>
    </div>
{/if}

<!-- Tap-mode FAB (touch only): always-visible toggle so the player can flip Reveal/Flag without
     opening Settings. Color matches the active mode (sky for Reveal, amber for Flag) so the
     state is readable at a glance. -->
{#if isPrimaryTouch}
    <button
        type="button"
        class="pointer-events-auto absolute bottom-16 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-xl ring-2 transition-colors {mobileMode === 'reveal' ? 'bg-sky-500 ring-sky-300/50 text-white' : 'bg-amber-500 ring-amber-300/50 text-white'}"
        onclick={toggleTapMode}
        title={mobileMode === "reveal" ? "Tap mode: Reveal — switch to Flag" : "Tap mode: Flag — switch to Reveal"}
        aria-label={mobileMode === "reveal" ? "Switch to flag mode" : "Switch to reveal mode"}
    >
        {mobileMode === "reveal" ? "⛏" : "🚩"}
    </button>
{/if}
