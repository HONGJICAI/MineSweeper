import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { flushSync } from "svelte";
import {
    ENDLESS_START_LEVEL,
    GameStatus,
    VOXEL_START_LEVEL,
} from "@caiji-games/minesweeper-cube-core";
import { createGameState, type GameState } from "./game.svelte.ts";

// reset() / advanceEndlessLevel() each schedule two setTimeouts at TRANSITION_HALF_MS = 250ms.
// Tests use fake timers so transitions complete deterministically.
const TRANSITION_HALF_MS = 250;

function createInRoot(opts: Parameters<typeof createGameState>[1] = {}): {
    game: GameState;
    cleanup: () => void;
} {
    let game!: GameState;
    const cleanup = $effect.root(() => {
        game = createGameState("easy", opts);
    });
    return { game, cleanup };
}

describe("createGameState — initial state", () => {
    let cleanup!: () => void;
    let game!: GameState;

    beforeEach(() => {
        ({ game, cleanup } = createInRoot());
    });

    afterEach(() => cleanup());

    test("starts in classic/easy/hollow/Init", () => {
        expect(game.mode).toBe("classic");
        expect(game.difficulty).toBe("easy");
        expect(game.cubeKind).toBe("hollow");
        expect(game.status).toBe(GameStatus.Init);
    });

    test("runId starts at 0 and transitionPhase is idle", () => {
        expect(game.runId).toBe(0);
        expect(game.transitionPhase).toBe("idle");
    });

    test("runCheated starts false", () => {
        expect(game.runCheated).toBe(false);
    });

    test("endlessMode defaults to normal", () => {
        expect(game.endlessMode).toBe("normal");
    });
});

describe("transitionPhase progression", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    test("reset() runs idle → shrinking → growing → idle", () => {
        const { game, cleanup } = createInRoot();
        expect(game.transitionPhase).toBe("idle");

        game.reset();
        flushSync();
        expect(game.transitionPhase).toBe("shrinking");

        vi.advanceTimersByTime(TRANSITION_HALF_MS);
        flushSync();
        expect(game.transitionPhase).toBe("growing");

        vi.advanceTimersByTime(TRANSITION_HALF_MS);
        flushSync();
        expect(game.transitionPhase).toBe("idle");

        cleanup();
    });
});

describe("setDifficulty", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    test("changes difficulty and bumps runId after the shrink", () => {
        const { game, cleanup } = createInRoot();
        const before = game.runId;

        game.setDifficulty("medium");
        flushSync();
        // runId is bumped *after* the shrink half — see comment in App.svelte timer effect.
        expect(game.runId).toBe(before);
        vi.advanceTimersByTime(TRANSITION_HALF_MS);
        flushSync();
        expect(game.difficulty).toBe("medium");
        expect(game.runId).toBe(before + 1);

        cleanup();
    });

    test("noop when called with the current difficulty in classic mode", () => {
        const { game, cleanup } = createInRoot();
        const before = game.runId;
        game.setDifficulty("easy");
        flushSync();
        expect(game.transitionPhase).toBe("idle");
        expect(game.runId).toBe(before);
        cleanup();
    });

    test("forces back to classic when called from endless", () => {
        const { game, cleanup } = createInRoot();
        game.setMode("endless");
        vi.advanceTimersByTime(TRANSITION_HALF_MS * 2);
        flushSync();
        expect(game.mode).toBe("endless");

        game.setDifficulty("medium");
        vi.advanceTimersByTime(TRANSITION_HALF_MS * 2);
        flushSync();
        expect(game.mode).toBe("classic");
        expect(game.difficulty).toBe("medium");
        cleanup();
    });
});

describe("setMode", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    test("classic → endless resets level to ENDLESS_START_LEVEL", () => {
        const { game, cleanup } = createInRoot();
        game.setMode("endless");
        vi.advanceTimersByTime(TRANSITION_HALF_MS * 2);
        flushSync();
        expect(game.mode).toBe("endless");
        expect(game.level).toBe(ENDLESS_START_LEVEL);
        cleanup();
    });

    test("noop when already in target mode", () => {
        const { game, cleanup } = createInRoot();
        const before = game.runId;
        game.setMode("classic");
        flushSync();
        expect(game.runId).toBe(before);
        expect(game.transitionPhase).toBe("idle");
        cleanup();
    });
});

describe("setEndlessMode", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    test("voxel sub-mode starts at VOXEL_START_LEVEL when in endless", () => {
        const { game, cleanup } = createInRoot();
        game.setMode("endless");
        vi.advanceTimersByTime(TRANSITION_HALF_MS * 2);
        flushSync();
        expect(game.level).toBe(ENDLESS_START_LEVEL);

        game.setEndlessMode("voxel");
        vi.advanceTimersByTime(TRANSITION_HALF_MS * 2);
        flushSync();
        expect(game.endlessMode).toBe("voxel");
        expect(game.cubeKind).toBe("voxel");
        expect(game.level).toBe(VOXEL_START_LEVEL);
        cleanup();
    });

    test("changing endlessMode in classic flips the flag but does not reset the board", () => {
        const { game, cleanup } = createInRoot();
        const before = game.runId;
        game.setEndlessMode("voxel");
        flushSync();
        expect(game.endlessMode).toBe("voxel");
        expect(game.transitionPhase).toBe("idle");
        expect(game.runId).toBe(before);
        // Still hollow because we never entered endless.
        expect(game.cubeKind).toBe("hollow");
        cleanup();
    });
});

describe("cheatAdvanceLevel + endless level progression", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    test("ignored in classic mode", () => {
        const { game, cleanup } = createInRoot();
        game.cheatAdvanceLevel();
        flushSync();
        expect(game.runCheated).toBe(false);
        expect(game.transitionPhase).toBe("idle");
        cleanup();
    });

    test("in endless: bumps level, sets runCheated, keeps the same runId", () => {
        const { game, cleanup } = createInRoot();
        game.setMode("endless");
        vi.advanceTimersByTime(TRANSITION_HALF_MS * 2);
        flushSync();
        const runId = game.runId;
        const startLevel = game.level;

        game.cheatAdvanceLevel();
        vi.advanceTimersByTime(TRANSITION_HALF_MS * 2);
        flushSync();
        expect(game.runCheated).toBe(true);
        expect(game.level).toBe(startLevel + 1);
        // Critical invariant: endless level changes do NOT bump runId. The timer in App.svelte
        // relies on this so accumulated time spans the whole run.
        expect(game.runId).toBe(runId);
        cleanup();
    });

    test("runCheated is cleared by the next fresh reset (mode change)", () => {
        const { game, cleanup } = createInRoot();
        game.setMode("endless");
        vi.advanceTimersByTime(TRANSITION_HALF_MS * 2);
        flushSync();
        game.cheatAdvanceLevel();
        vi.advanceTimersByTime(TRANSITION_HALF_MS * 2);
        flushSync();
        expect(game.runCheated).toBe(true);

        game.setMode("classic");
        vi.advanceTimersByTime(TRANSITION_HALF_MS * 2);
        flushSync();
        expect(game.runCheated).toBe(false);
        cleanup();
    });

    test("onEndlessClear callback fires at the start of the shrink", () => {
        const calls: number[] = [];
        const { game, cleanup } = createInRoot({ onEndlessClear: () => calls.push(Date.now()) });
        game.setMode("endless");
        vi.advanceTimersByTime(TRANSITION_HALF_MS * 2);
        flushSync();
        expect(calls).toHaveLength(0);

        game.cheatAdvanceLevel();
        flushSync();
        // Fired immediately, before either timer half has elapsed.
        expect(calls).toHaveLength(1);
        expect(game.transitionPhase).toBe("shrinking");
        cleanup();
    });
});
