// Integration test that exercises the cross-store wiring the way App.svelte does. The recording
// effect that turns a Win/GameOver into a leaderboard + history + unlocks update lives inside
// App.svelte, so a regression there (e.g. losses recorded as wins, unlocks not progressing) is
// invisible to the per-store unit tests. This file composes the same factories, attaches a
// mirror of that effect, and drives a full classic-mode win and loss end-to-end.
//
// Caveats: the renderer is not exercised here (no Threlte / Three / WebGL in node). What this
// covers is the pure state-and-rules surface — the same surface a Playwright run would also
// touch, but without the cost / flake.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { flushSync } from "svelte";
import {
    FACES,
    GameStatus,
    type Cube,
    type CubePosition,
} from "@caiji-games/minesweeper-cube-core";
import { createTimerState } from "@caiji-games/shared-state";
import { createGameState } from "./game.svelte.ts";
import { createLeaderboardState } from "./leaderboard.svelte.ts";
import { createPlayHistoryState } from "./playHistory.svelte.ts";
import { createUnlockState } from "./unlocks.svelte.ts";

// Mirror the recording effect from App.svelte. Kept in lockstep with App.svelte; if you change
// the recording rules there, update this helper.
function attachRecordingEffect(
    game: ReturnType<typeof createGameState>,
    timer: ReturnType<typeof createTimerState>,
    leaderboard: ReturnType<typeof createLeaderboardState>,
    history: ReturnType<typeof createPlayHistoryState>,
) {
    let prevStatus: GameStatus = game.status;
    let prevRunId: number = game.runId;
    $effect(() => {
        const s = game.status;
        const r = game.runId;
        if (r !== prevRunId) timer.reset();
        if (s === GameStatus.Gaming && game.transitionPhase === "idle") timer.start();
        else timer.stop();
        if (s === GameStatus.Init && r !== prevRunId) timer.reset();

        if (prevStatus !== s && (s === GameStatus.Win || s === GameStatus.GameOver)) {
            if (game.mode === "classic") {
                const entry = {
                    result: s === GameStatus.Win ? ("Win" as const) : ("Loss" as const),
                    time: timer.seconds,
                    date: new Date().toISOString(),
                };
                if (s === GameStatus.Win) leaderboard.add(game.difficulty, entry);
                history.addEntry(game.difficulty, entry);
            }
        }
        prevStatus = s;
        prevRunId = r;
    });
}

// Mirror the unlock-progression effect from App.svelte.
function attachUnlockEffect(
    leaderboard: ReturnType<typeof createLeaderboardState>,
    unlocks: ReturnType<typeof createUnlockState>,
) {
    $effect(() => {
        if (leaderboard.boards.easy.length > 0) unlocks.unlock("medium");
        if (leaderboard.boards.medium.length > 0) unlocks.unlock("hard");
    });
}

// Plays the game to a win by revealing one corner (which triggers mine placement) then sweeping
// every remaining non-mine cell. Skipping already-revealed cells is handled inside reveal().
function playToWin(game: ReturnType<typeof createGameState>) {
    const seed: CubePosition = { face: "F", r: 0, c: 0 };
    game.reveal(seed);
    const N = game.N;
    const cube = game.cube as Cube;
    for (const face of FACES) {
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                if (!cube[face][r][c].isMine) game.reveal({ face, r, c });
            }
        }
    }
}

// Plays the game to a loss by revealing one safe cell to seed mine placement, then stepping on
// the first mine we can find.
function playToLoss(game: ReturnType<typeof createGameState>) {
    const seed: CubePosition = { face: "F", r: 0, c: 0 };
    game.reveal(seed);
    const N = game.N;
    const cube = game.cube as Cube;
    for (const face of FACES) {
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                if (cube[face][r][c].isMine) {
                    game.reveal({ face, r, c });
                    return;
                }
            }
        }
    }
    throw new Error("test setup bug: no mine found after generation");
}

describe("happy path — classic easy", () => {
    beforeEach(() => {
        localStorage.clear();
        // Pin timer math so leaderboard `time` values are deterministic.
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    });
    afterEach(() => vi.useRealTimers());

    test("full win records leaderboard + history and unlocks medium", () => {
        let game!: ReturnType<typeof createGameState>;
        let leaderboard!: ReturnType<typeof createLeaderboardState>;
        let history!: ReturnType<typeof createPlayHistoryState>;
        let unlocks!: ReturnType<typeof createUnlockState>;

        const cleanup = $effect.root(() => {
            game = createGameState("easy");
            const timer = createTimerState();
            leaderboard = createLeaderboardState();
            history = createPlayHistoryState();
            unlocks = createUnlockState();
            attachRecordingEffect(game, timer, leaderboard, history);
            attachUnlockEffect(leaderboard, unlocks);
        });

        // Pre-conditions: only easy is unlocked.
        expect(unlocks.easy).toBe(true);
        expect(unlocks.medium).toBe(false);
        expect(unlocks.hard).toBe(false);

        playToWin(game);
        flushSync();

        expect(game.status).toBe(GameStatus.Win);
        expect(leaderboard.boards.easy).toHaveLength(1);
        expect(leaderboard.boards.easy[0].result).toBe("Win");
        expect(history.map.easy).toHaveLength(1);
        expect(history.map.easy[0].result).toBe("Win");
        // Medium unlocks from the leaderboard-driven effect; hard stays locked until medium win.
        expect(unlocks.medium).toBe(true);
        expect(unlocks.hard).toBe(false);
        cleanup();
    });

    test("loss records only history (not leaderboard) and does NOT unlock medium", () => {
        let game!: ReturnType<typeof createGameState>;
        let leaderboard!: ReturnType<typeof createLeaderboardState>;
        let history!: ReturnType<typeof createPlayHistoryState>;
        let unlocks!: ReturnType<typeof createUnlockState>;

        const cleanup = $effect.root(() => {
            game = createGameState("easy");
            const timer = createTimerState();
            leaderboard = createLeaderboardState();
            history = createPlayHistoryState();
            unlocks = createUnlockState();
            attachRecordingEffect(game, timer, leaderboard, history);
            attachUnlockEffect(leaderboard, unlocks);
        });

        playToLoss(game);
        flushSync();

        expect(game.status).toBe(GameStatus.GameOver);
        expect(leaderboard.boards.easy).toEqual([]);
        expect(history.map.easy).toHaveLength(1);
        expect(history.map.easy[0].result).toBe("Loss");
        expect(unlocks.medium).toBe(false);
        cleanup();
    });

    test("state survives full rehydration after a win", () => {
        // Round 1: win and let persistence flush.
        const c1 = $effect.root(() => {
            const game = createGameState("easy");
            const timer = createTimerState();
            const leaderboard = createLeaderboardState();
            const history = createPlayHistoryState();
            const unlocks = createUnlockState();
            attachRecordingEffect(game, timer, leaderboard, history);
            attachUnlockEffect(leaderboard, unlocks);
            playToWin(game);
        });
        flushSync();
        c1();

        // Round 2: fresh factories, same localStorage — should reflect round 1's win.
        let leaderboard!: ReturnType<typeof createLeaderboardState>;
        let history!: ReturnType<typeof createPlayHistoryState>;
        let unlocks!: ReturnType<typeof createUnlockState>;
        const c2 = $effect.root(() => {
            leaderboard = createLeaderboardState();
            history = createPlayHistoryState();
            unlocks = createUnlockState();
            // Same migration path as a returning user: the unlock effect re-runs with rehydrated
            // leaderboard data and re-grants unlocks.
            attachUnlockEffect(leaderboard, unlocks);
        });

        expect(leaderboard.boards.easy).toHaveLength(1);
        expect(history.map.easy).toHaveLength(1);
        expect(unlocks.medium).toBe(true);
        c2();
    });
});
