import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { flushSync } from "svelte";
import { createPlayHistoryState, type PlayHistoryState } from "./playHistory.svelte.ts";
import type { CubeHistoryEntry } from "./historyTypes.ts";

const win = (time: number, date = "2026-01-01T00:00:00.000Z"): CubeHistoryEntry => ({
    result: "Win",
    time,
    date,
});
const loss = (time: number, date = "2026-01-01T00:00:00.000Z"): CubeHistoryEntry => ({
    result: "Loss",
    time,
    date,
});

describe("createPlayHistoryState", () => {
    let h!: PlayHistoryState;
    let cleanup!: () => void;

    beforeEach(() => {
        localStorage.clear();
        cleanup = $effect.root(() => {
            h = createPlayHistoryState();
        });
    });

    afterEach(() => {
        cleanup();
    });

    test("initial: empty per difficulty", () => {
        expect(h.map.easy).toEqual([]);
        expect(h.map.medium).toEqual([]);
        expect(h.map.hard).toEqual([]);
    });

    test("addEntry records both wins and losses (unlike leaderboard)", () => {
        h.addEntry("easy", win(20));
        h.addEntry("easy", loss(5));
        flushSync();
        expect(h.map.easy.map(e => e.result)).toEqual(["Loss", "Win"]);
    });

    test("newest entry is at the head", () => {
        h.addEntry("medium", win(10, "2026-01-01T00:00:00.000Z"));
        h.addEntry("medium", win(20, "2026-02-02T00:00:00.000Z"));
        flushSync();
        expect(h.map.medium[0].time).toBe(20);
    });

    test("difficulties don't bleed into each other", () => {
        h.addEntry("easy", win(10));
        h.addEntry("hard", loss(5));
        flushSync();
        expect(h.map.easy).toHaveLength(1);
        expect(h.map.medium).toHaveLength(0);
        expect(h.map.hard).toHaveLength(1);
    });

    test("caps at 30 most recent per difficulty", () => {
        for (let i = 0; i < 35; i++) h.addEntry("easy", win(i));
        flushSync();
        expect(h.map.easy).toHaveLength(30);
        // Newest (time=34) at the head; oldest kept (time=5) at the tail.
        expect(h.map.easy[0].time).toBe(34);
        expect(h.map.easy[29].time).toBe(5);
    });

    test("clear() empties every difficulty", () => {
        h.addEntry("easy", win(10));
        h.addEntry("medium", loss(5));
        flushSync();
        h.clear();
        flushSync();
        expect(h.map.easy).toEqual([]);
        expect(h.map.medium).toEqual([]);
    });
});

describe("createPlayHistoryState persistence", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test("rehydrates entries on remount", () => {
        const c1 = $effect.root(() => {
            const a = createPlayHistoryState();
            a.addEntry("hard", win(40));
            a.addEntry("hard", loss(20));
        });
        flushSync();
        c1();

        let b!: PlayHistoryState;
        const c2 = $effect.root(() => { b = createPlayHistoryState(); });
        expect(b.map.hard.map(e => e.result)).toEqual(["Loss", "Win"]);
        c2();
    });
});
