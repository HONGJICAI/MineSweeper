<script lang="ts">
    import { Canvas } from "@threlte/core";
    import { GameStatus, getNeighbors, type CubePosition } from "@caiji-games/minesweeper-cube-core";
    import Cube3D from "./components/cube/Cube3D.svelte";
    import HUD from "./components/HUD.svelte";
    import StatsModal from "./components/StatsModal.svelte";
    import { createTimerState } from "@caiji-games/shared-state";
    import { createGameState } from "./state/game.svelte.ts";
    import { createLeaderboardState } from "./state/leaderboard.svelte.ts";
    import { createPlayHistoryState } from "./state/playHistory.svelte.ts";
    import { createEndlessHistoryState } from "./state/endlessHistory.svelte.ts";
    import { celebrate } from "./lib/celebrate.ts";
    import type { MobileMode } from "./state/mobileMode.ts";

    const game = createGameState("easy");
    const timer = createTimerState();
    const leaderboard = createLeaderboardState();
    const history = createPlayHistoryState();
    const endlessHistory = createEndlessHistoryState();

    let showStats = $state(false);

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
    // unrevealed neighbors that the chord *would* reveal — same UX as a desktop 2D minesweeper.
    // Pointer-leave or pointer-up clears it. Drag cancels because the leave fires first.
    let chordCenter = $state<CubePosition | null>(null);
    const pressedKeys = $derived.by((): Set<string> => {
        if (!chordCenter) return new Set();
        const c = game.cube[chordCenter.face][chordCenter.r][chordCenter.c];
        if (!c.isRevealed || c.adjacentMines === 0) return new Set();
        const set = new Set<string>();
        for (const n of getNeighbors(chordCenter.face, chordCenter.r, chordCenter.c, game.N)) {
            const nb = game.cube[n.face][n.r][n.c];
            if (!nb.isRevealed && !nb.isFlagged) set.add(`${n.face}:${n.r},${n.c}`);
        }
        return set;
    });

    // Timer + history recording follow game status. Single tracked transition source.
    // prevStatus / prevRunId are plain `let` (not $state) — writing to them inside the effect
    // would otherwise re-trigger the effect. Nothing outside needs to observe them.
    let prevStatus: GameStatus = game.status;
    let prevRunId: number = game.runId;
    let prevLevel: number = game.level;
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

        // Endless: a level bump means the player just cleared a cube. Tiny celebration, no
        // history record (the run only ends on a mine).
        if (game.mode === "endless" && lvl !== prevLevel && r === prevRunId) {
            celebrate();
        }

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
                    celebrate();
                }
                history.addEntry(game.difficulty, entry);
            } else if (s === GameStatus.GameOver && !game.runCheated) {
                // Endless run ended on a mine. lvl is the level the player was on when they died,
                // so that's their max-reached. Cheated runs (Konami code used) are excluded.
                endlessHistory.addRun({
                    maxLevel: lvl,
                    time: timer.seconds,
                    date: new Date().toISOString(),
                });
            }
        }

        prevStatus = s;
        prevRunId = r;
        prevLevel = lvl;
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

<main class="relative h-dvh w-dvw bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
    <Canvas>
        <Cube3D
            {game}
            forceFlag={isPrimaryTouch && mobileMode === "flag" && game.status === GameStatus.Gaming}
            {pressedKeys}
            onChordPressStart={(p: CubePosition) => (chordCenter = p)}
            onChordPressEnd={() => (chordCenter = null)}
        />
    </Canvas>
    <HUD
        {game}
        {timer}
        {isPrimaryTouch}
        {mobileMode}
        setMobileMode={(m) => (mobileMode = m)}
        onShowStats={() => (showStats = true)}
    />
</main>

{#if showStats}
    <StatsModal
        {leaderboard}
        {history}
        {endlessHistory}
        onClose={() => (showStats = false)}
    />
{/if}
