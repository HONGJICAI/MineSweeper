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
    import { celebrate } from "./lib/celebrate.ts";
    import type { MobileMode } from "./state/mobileMode.ts";

    const game = createGameState("easy");
    const timer = createTimerState();
    const leaderboard = createLeaderboardState();
    const history = createPlayHistoryState();

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
    // prevStatus is intentionally a plain `let` (not $state) — writing to it inside the effect
    // would otherwise re-trigger the effect. Nothing outside this effect needs to observe it.
    let prevStatus: GameStatus = game.status;
    $effect(() => {
        const s = game.status;
        if (s === GameStatus.Gaming) {
            if (prevStatus !== GameStatus.Gaming) timer.reset();
            timer.start();
        } else {
            timer.stop();
            if (s === GameStatus.Init) timer.reset();
        }

        // Record on Win/GameOver only when *transitioning into* that state (skip mount echo,
        // skip re-runs from cube-state churn within the same status).
        if (prevStatus !== s && (s === GameStatus.Win || s === GameStatus.GameOver)) {
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
        }

        prevStatus = s;
    });

    function preventCtx(e: MouseEvent) {
        // Suppress browser context menu so right-clicks reach the canvas.
        e.preventDefault();
    }
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
        onClose={() => (showStats = false)}
    />
{/if}
