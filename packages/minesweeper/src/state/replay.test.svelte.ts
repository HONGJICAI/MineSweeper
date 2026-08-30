import { describe, test, expect, beforeEach, afterEach, vi, type Mock } from "vitest";
import { flushSync } from "svelte";
import { createReplayState, type ReplayState } from "./replay.svelte.ts";
import { GameStatus, type Position, type UserActionDetail } from "@caiji-games/minesweeper-core";

function action(r: number, c: number, type: UserActionDetail["type"] = "reveal", time = 100): UserActionDetail {
    return { position: { r, c }, type, time } as UserActionDetail;
}

let status: GameStatus;
let reset: Mock<() => void>;
let reveal: Mock<(r: number, c: number, seed?: string, replay?: boolean) => void>;
let chord: Mock<(r: number, c: number) => void>;
let toggleFlag: Mock<(r: number, c: number) => void>;
let addUserAction: Mock<(a: UserActionDetail) => void>;
let setHighlightedCell: Mock<(c: Position | undefined) => void>;

function createInRoot(): { replay: ReplayState; cleanup: () => void } {
    let replay!: ReplayState;
    const cleanup = $effect.root(() => {
        replay = createReplayState({
            getGameStatus: () => status,
            reset,
            reveal,
            chord,
            toggleFlag,
            addUserAction,
            setHighlightedCell,
        });
    });
    return { replay, cleanup };
}

beforeEach(() => {
    vi.useFakeTimers();
    status = GameStatus.Gaming;
    reset = vi.fn();
    reveal = vi.fn();
    chord = vi.fn();
    toggleFlag = vi.fn();
    addUserAction = vi.fn();
    setHighlightedCell = vi.fn();
});

afterEach(() => {
    vi.useRealTimers();
});

describe("replay playback", () => {
    test("open shows the overlay but plays nothing until start", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0), action(1, 1)]);
        flushSync();

        expect(replay.showOverlay).toBe(true);
        expect(replay.autoPlaying).toBe(false);
        expect(reveal).not.toHaveBeenCalled();
        cleanup();
    });

    test("start applies the first action immediately", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0), action(1, 1)]);
        replay.start(100);
        flushSync();

        expect(reveal).toHaveBeenCalledTimes(1);
        expect(reveal).toHaveBeenCalledWith(0, 0, "seed", true);
        cleanup();
    });

    test("each action type routes to its own handler", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0, "reveal"), action(1, 1, "flag"), action(2, 2, "chord")]);
        replay.start(100);
        flushSync();
        vi.advanceTimersByTime(100);
        flushSync();
        vi.advanceTimersByTime(100);
        flushSync();

        expect(reveal).toHaveBeenCalledWith(0, 0, "seed", true);
        expect(toggleFlag).toHaveBeenCalledWith(1, 1);
        expect(chord).toHaveBeenCalledWith(2, 2);
        cleanup();
    });

    test("progress counts from 1 and reports the total", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0), action(1, 1), action(2, 2)]);
        replay.start(100);
        flushSync();
        expect(replay.progress).toEqual({ current: 1, total: 3 });

        vi.advanceTimersByTime(100);
        flushSync();
        expect(replay.progress).toEqual({ current: 2, total: 3 });
        cleanup();
    });

    test("the overlay closes by itself once the queue drains", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0)]);
        replay.start(100);
        flushSync();
        vi.advanceTimersByTime(100);
        flushSync();

        expect(replay.showOverlay).toBe(false);
        expect(replay.autoPlaying).toBe(false);
        expect(setHighlightedCell).toHaveBeenCalledWith(undefined);
        cleanup();
    });

    test("playback halts if the game ends mid-replay", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0), action(1, 1)]);
        replay.start(100);
        flushSync();
        expect(reveal).toHaveBeenCalledTimes(1);

        status = GameStatus.GameOver;
        vi.advanceTimersByTime(100);
        flushSync();

        expect(reveal).toHaveBeenCalledTimes(1);
        cleanup();
    });
});

describe("pause / resume", () => {
    test("pausing stops the queue from advancing", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0), action(1, 1), action(2, 2)]);
        replay.start(100);
        flushSync();
        expect(reveal).toHaveBeenCalledTimes(1);

        replay.togglePause();
        flushSync();
        expect(replay.paused).toBe(true);

        // The timer armed before pausing must have been cleared, not merely ignored.
        vi.advanceTimersByTime(1000);
        flushSync();
        expect(reveal).toHaveBeenCalledTimes(1);
        expect(replay.progress).toEqual({ current: 1, total: 3 });
        cleanup();
    });

    test("resuming continues from the same step without replaying it", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0), action(1, 1), action(2, 2)]);
        replay.start(100);
        flushSync();

        replay.togglePause();
        flushSync();
        replay.togglePause();
        flushSync();

        expect(replay.paused).toBe(false);
        // Still one call: resuming re-arms the timer, it does not re-apply the current action.
        expect(reveal).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(100);
        flushSync();
        expect(reveal).toHaveBeenCalledTimes(2);
        cleanup();
    });

    test("pausing repeatedly does not stack duplicate actions", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0), action(1, 1)]);
        replay.start(100);
        flushSync();

        for (let i = 0; i < 4; i++) {
            replay.togglePause();
            flushSync();
        }

        expect(replay.paused).toBe(false);
        expect(reveal).toHaveBeenCalledTimes(1);
        expect(addUserAction).toHaveBeenCalledTimes(1);
        cleanup();
    });

    test("togglePause is inert before playback starts", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0)]);
        flushSync();

        replay.togglePause();
        flushSync();

        // Otherwise the speed picker could be dismissed into a paused state with no way back.
        expect(replay.paused).toBe(false);
        cleanup();
    });

    test("cancel clears the paused flag so the next replay starts clean", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0), action(1, 1)]);
        replay.start(100);
        flushSync();
        replay.togglePause();
        flushSync();
        expect(replay.paused).toBe(true);

        replay.cancel();
        flushSync();

        expect(replay.paused).toBe(false);
        expect(replay.showOverlay).toBe(false);
        expect(reset).toHaveBeenCalled();
        cleanup();
    });

    test("a paused replay stops firing even as time passes", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0), action(1, 1), action(2, 2), action(3, 3)]);
        replay.start(100);
        flushSync();

        vi.advanceTimersByTime(100);
        flushSync();
        expect(reveal).toHaveBeenCalledTimes(2);

        replay.togglePause();
        flushSync();
        vi.advanceTimersByTime(5000);
        flushSync();
        expect(reveal).toHaveBeenCalledTimes(2);

        replay.togglePause();
        flushSync();
        vi.advanceTimersByTime(100);
        flushSync();
        expect(reveal).toHaveBeenCalledTimes(3);
        cleanup();
    });
});

describe("paused is observable to callers", () => {
    // App.svelte gates the game clock on this: `gameStatus === Gaming && !replay.paused`.
    // Without the flag being readable and accurate the timer keeps counting while the board is
    // frozen, so the elapsed time and the replayed position drift apart on screen.
    test("paused flips true and back, so the timer effect can follow it", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0), action(1, 1)]);
        replay.start(100);
        flushSync();
        expect(replay.paused).toBe(false);

        replay.togglePause();
        flushSync();
        expect(replay.paused).toBe(true);

        replay.togglePause();
        flushSync();
        expect(replay.paused).toBe(false);
        cleanup();
    });

    test("paused is false once the replay finishes on its own", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0)]);
        replay.start(100);
        flushSync();
        vi.advanceTimersByTime(100);
        flushSync();

        // Otherwise a finished replay could leave the clock stopped for the next real game.
        expect(replay.paused).toBe(false);
        expect(replay.autoPlaying).toBe(false);
        cleanup();
    });
});

describe("real-time speed", () => {
    test("speed -1 uses each action's recorded delay", () => {
        const { replay, cleanup } = createInRoot();
        replay.open("seed", [action(0, 0, "reveal", 300), action(1, 1, "reveal", 50)]);
        replay.start(-1);
        flushSync();
        expect(reveal).toHaveBeenCalledTimes(1);

        // The first action recorded 300ms, so nothing should fire before then.
        vi.advanceTimersByTime(299);
        flushSync();
        expect(reveal).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(1);
        flushSync();
        expect(reveal).toHaveBeenCalledTimes(2);
        cleanup();
    });
});
