<script lang="ts">
    import { Canvas } from "@threlte/core";
    import {
        GameStatus,
        getNeighbors,
        getSurfaceVoxelNeighbors,
        type Cube,
        type CubePosition,
        type VoxelCube,
        type VoxelPos,
    } from "@caiji-games/minesweeper-cube-core";
    import Cube3D from "./components/cube/Cube3D.svelte";
    import HUD from "./components/HUD.svelte";
    import StatsModal from "./components/StatsModal.svelte";
    import { createTimerState } from "@caiji-games/shared-state";
    import { createGameState } from "./state/game.svelte.ts";
    import { createLeaderboardState } from "./state/leaderboard.svelte.ts";
    import { createPlayHistoryState } from "./state/playHistory.svelte.ts";
    import { createEndlessHistoryState } from "./state/endlessHistory.svelte.ts";
    import { createUnlockState } from "./state/unlocks.svelte.ts";
    import { createAdsState } from "$ads";
    import { celebrate } from "./lib/celebrate.ts";
    import type { MobileMode } from "./state/mobileMode.ts";

    const game = createGameState("easy", { onEndlessClear: () => celebrate() });
    const timer = createTimerState();
    const leaderboard = createLeaderboardState();
    const history = createPlayHistoryState();
    const endlessHistory = {
        normal: createEndlessHistoryState("normal"),
        voxel:  createEndlessHistoryState("voxel"),
    };
    const unlocks = createUnlockState();
    const ads = createAdsState();

    // Init AdMob on mount (Android only — silently no-ops elsewhere). Banner is shown after
    // init resolves; interstitials trigger from the Win/GameOver transition below.
    $effect(() => {
        ads.init().then(() => ads.showBanner());
    });

    // Progression unlocks: winning a tier grants the next. Implemented as a leaderboard-driven
    // effect so it covers both live wins (leaderboard.add re-triggers this) and migration for
    // returning players who already have wins from before the unlock system shipped. Easy is
    // always initial:true so we only need to handle medium/hard here.
    $effect(() => {
        if (leaderboard.boards.easy.length > 0) unlocks.unlock("medium");
        if (leaderboard.boards.medium.length > 0) unlocks.unlock("hard");
    });

    let showStats = $state(false);
    // Lifted out of HUD so the Android back-button handler below can close the sheet without
    // the press bubbling up to "exit app".
    let showSettings = $state(false);

    // Android back-button: by default WebView has 1 history entry → pressing back exits the
    // whole app, which is jarring when a modal is open. We prime the history with a sentinel
    // on mount, then on each `popstate` decide what the back press should dismiss. After
    // dismissing we re-prime, so the *next* back press has somewhere to "go back to".
    // No router needed — straight history API, works on Android WebView, iOS WKWebView, and
    // desktop browsers.
    $effect(() => {
        if (typeof window === "undefined") return;
        window.history.pushState({ sentinel: true }, "");
        const onPop = () => {
            if (showStats)    { showStats    = false; window.history.pushState({ sentinel: true }, ""); return; }
            if (showSettings) { showSettings = false; window.history.pushState({ sentinel: true }, ""); return; }
            // Nothing to dismiss — let the back press exit the app (don't re-push).
        };
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    });

    // Touch-primary detection: phones/tablets get a Reveal/Flag mode toggle since they have
    // no right-click. Updates if the user docks/undocks a hybrid device mid-session.
    const initialTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    let isPrimaryTouch = $state<boolean>(initialTouch);
    let mobileMode = $state<MobileMode>("reveal");

    $effect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(pointer: coarse)");
        const handler = (e: MediaQueryListEvent) => (isPrimaryTouch = e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    });

    // Chord-press preview: while pointer is held on a revealed numbered cell, lighten the
    // unrevealed neighbors that the chord *would* reveal. Works for both modes — the key format
    // matches what the renderer (CubeFace / VoxelGrid) builds when looking up cells.
    let chordCenter = $state<CubePosition | VoxelPos | null>(null);
    const pressedKeys = $derived.by((): Set<string> => {
        if (!chordCenter) return new Set();
        if (game.cubeKind === "voxel") {
            const cc = chordCenter as VoxelPos;
            const voxelCube = game.cube as VoxelCube;
            const c = voxelCube[cc.x][cc.y][cc.z];
            if (!c.isRevealed || c.adjacentMines === 0) return new Set();
            const set = new Set<string>();
            for (const n of getSurfaceVoxelNeighbors(cc.x, cc.y, cc.z, game.N)) {
                const nb = voxelCube[n.x][n.y][n.z];
                if (!nb.isRevealed && !nb.isFlagged) set.add(`${n.x},${n.y},${n.z}`);
            }
            return set;
        }
        const cc = chordCenter as CubePosition;
        const hollowCube = game.cube as Cube;
        const c = hollowCube[cc.face][cc.r][cc.c];
        if (!c.isRevealed || c.adjacentMines === 0) return new Set();
        const set = new Set<string>();
        for (const n of getNeighbors(cc.face, cc.r, cc.c, game.N)) {
            const nb = hollowCube[n.face][n.r][n.c];
            if (!nb.isRevealed && !nb.isFlagged) set.add(`${n.face}:${n.r},${n.c}`);
        }
        return set;
    });

    // Timer + history recording follow game status. Single tracked transition source.
    // prevStatus / prevRunId are plain `let` (not $state) — writing to them inside the effect
    // would otherwise re-trigger the effect. Nothing outside needs to observe them.
    let prevStatus: GameStatus = game.status;
    let prevRunId: number = game.runId;
    $effect(() => {
        const s = game.status;
        const r = game.runId;
        const lvl = game.level;

        // runId only bumps on a fresh start (reset / mode-change / difficulty-change). Endless
        // level transitions keep the same runId so the timer accumulates across the whole run.
        if (r !== prevRunId) timer.reset();

        // Pause the timer during level-bump transitions so the visual animation length doesn't
        // count toward leaderboard times. This decouples "how long the animation is" from the
        // competitive metric — future tweaks to TRANSITION_HALF_MS won't invalidate old records.
        if (s === GameStatus.Gaming && game.transitionPhase === "idle") timer.start();
        else timer.stop();
        if (s === GameStatus.Init && r !== prevRunId) timer.reset();

        // Endless: confetti is fired by game state's onEndlessClear callback at the start of
        // the shrink animation (so the celebration overlaps with the cube shrinking out, not
        // after it). Nothing extra to do here.

        // Record on Win/GameOver only when *transitioning into* that state (skip mount echo).
        // Win never fires in endless mode (the state silently advances), so this branch only
        // records classic completions and any-mode losses.
        if (prevStatus !== s && (s === GameStatus.Win || s === GameStatus.GameOver)) {
            if (game.mode === "classic") {
                const entry = {
                    result: s === GameStatus.Win ? ("Win" as const) : ("Loss" as const),
                    time: timer.seconds,
                    date: new Date().toISOString(),
                };
                if (s === GameStatus.Win) {
                    leaderboard.add(game.difficulty, entry);
                    // Unlock progression is handled by the leaderboard-driven effect above.
                    celebrate();
                }
                history.addEntry(game.difficulty, entry);
            } else if (s === GameStatus.GameOver && !game.runCheated) {
                // Endless run ended on a mine. Sub-mode picks which leaderboard to record into;
                // cheated runs (Konami code) are excluded.
                endlessHistory[game.endlessMode].addRun({
                    maxLevel: lvl,
                    time: timer.seconds,
                    date: new Date().toISOString(),
                });
            }
            // Note: interstitial is NOT triggered here. AdMob policy requires user-initiated
            // ad surfaces — we fire it from HUD's restart button instead so the ad is a clear
            // consequence of the player's tap, not the loss/win moment.
        }

        prevStatus = s;
        prevRunId = r;
    });

    function preventCtx(e: MouseEvent) {
        // Suppress browser context menu so right-clicks reach the canvas.
        e.preventDefault();
    }

    // Dev cheat: Konami code (↑↑↓↓←→←→BA) jumps to the next endless level. Marks the run as
    // cheated so the leaderboard ignores it. Wrong key resets progress (with a small smart-restart
    // if the wrong key happens to be the first key of the sequence).
    const KONAMI: readonly string[] = [
        "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
        "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
        "b", "a",
    ];
    let konamiProgress = 0;
    $effect(() => {
        if (typeof window === "undefined") return;
        const handler = (e: KeyboardEvent) => {
            // Compare arrow keys verbatim, letters case-insensitively.
            const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
            if (key === KONAMI[konamiProgress]) {
                konamiProgress++;
                if (konamiProgress === KONAMI.length) {
                    konamiProgress = 0;
                    game.cheatAdvanceLevel();
                }
            } else {
                konamiProgress = key === KONAMI[0] ? 1 : 0;
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    });
</script>

<svelte:window oncontextmenu={preventCtx} />

<!--
    Layout: WebView fills the activity edge-to-edge; the AdMob banner is a native Android view
    layered ON TOP of the WebView at screen bottom (Activity.addContentView + Gravity.BOTTOM).
    To keep the banner from covering game pixels, we reserve a sibling spacer at the bottom of
    the page that matches the banner footprint (50dp standard banner + safe-area-inset-bottom).
    The flex column makes <main> shrink to fill the remaining height; threlte's Canvas auto-fits.
-->
<div class="flex h-dvh w-dvw flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
    <main class="relative min-h-0 flex-1">
        <Canvas>
            <Cube3D
                {game}
                forceFlag={isPrimaryTouch && mobileMode === "flag" && game.status === GameStatus.Gaming}
                {pressedKeys}
                onChordPressStart={(p: CubePosition | VoxelPos) => (chordCenter = p)}
                onChordPressEnd={() => (chordCenter = null)}
            />
        </Canvas>
        <HUD
            {game}
            {timer}
            {unlocks}
            {ads}
            {isPrimaryTouch}
            {mobileMode}
            setMobileMode={(m) => (mobileMode = m)}
            onShowStats={() => (showStats = true)}
            {showSettings}
            setShowSettings={(v) => (showSettings = v)}
        />
    </main>
    {#if ads.bannerShown}
        <!-- Reserved area for the AdMob banner overlay. 50px matches AdSize.BANNER on phones;
             the safe-area-inset-bottom term adds room for gesture-nav strip on full-screen
             devices so the banner doesn't sit on top of it. -->
        <div class="shrink-0" style:height="calc(50px + env(safe-area-inset-bottom))"></div>
    {/if}
</div>

{#if showStats}
    <StatsModal
        {leaderboard}
        {history}
        {endlessHistory}
        onClose={() => (showStats = false)}
    />
{/if}
