import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { flushSync } from "svelte";
import { createLeaderboardState, type LeaderboardState } from "./leaderboard.svelte.ts";
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

describe("createLeaderboardState", () => {
    let lb!: LeaderboardState;
    let cleanup!: () => void;

    beforeEach(() => {
        localStorage.clear();
        cleanup = $effect.root(() => {
            lb = createLeaderboardState();
        });
    });

    afterEach(() => {
        cleanup();
    });

    test("initial: empty boards for every difficulty", () => {
        expect(lb.boards.easy).toEqual([]);
        expect(lb.boards.medium).toEqual([]);
        expect(lb.boards.hard).toEqual([]);
    });

    test("add(Win) appends the entry", () => {
        lb.add("easy", win(30));
        flushSync();
        expect(lb.boards.easy).toEqual([win(30)]);
    });

    test("add(Loss) is rejected — leaderboard tracks wins only", () => {
        lb.add("easy", loss(10));
        flushSync();
        expect(lb.boards.easy).toEqual([]);
    });

    test("entries sort by time ascending", () => {
        lb.add("medium", win(50));
        lb.add("medium", win(20));
        lb.add("medium", win(35));
        flushSync();
        expect(lb.boards.medium.map(e => e.time)).toEqual([20, 35, 50]);
    });

    test("ties on time break by earlier date first", () => {
        lb.add("hard", win(40, "2026-02-02T00:00:00.000Z"));
        lb.add("hard", win(40, "2026-01-01T00:00:00.000Z"));
        flushSync();
        expect(lb.boards.hard.map(e => e.date)).toEqual([
            "2026-01-01T00:00:00.000Z",
            "2026-02-02T00:00:00.000Z",
        ]);
    });

    test("keeps only the top 5 fastest wins", () => {
        for (const t of [60, 10, 50, 20, 40, 30, 70]) lb.add("easy", win(t));
        flushSync();
        expect(lb.boards.easy.map(e => e.time)).toEqual([10, 20, 30, 40, 50]);
    });

    test("difficulties don't bleed into each other", () => {
        lb.add("easy", win(10));
        lb.add("medium", win(20));
        flushSync();
        expect(lb.boards.easy).toHaveLength(1);
        expect(lb.boards.medium).toHaveLength(1);
        expect(lb.boards.hard).toHaveLength(0);
    });

    test("clear() resets every difficulty", () => {
        lb.add("easy", win(10));
        lb.add("hard", win(20));
        flushSync();
        lb.clear();
        flushSync();
        expect(lb.boards.easy).toEqual([]);
        expect(lb.boards.hard).toEqual([]);
    });
});

describe("createLeaderboardState persistence", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test("survives a remount via localStorage", () => {
        const c1 = $effect.root(() => {
            const a = createLeaderboardState();
            a.add("medium", win(15));
        });
        flushSync();
        c1();

        let b!: LeaderboardState;
        const c2 = $effect.root(() => { b = createLeaderboardState(); });
        expect(b.boards.medium).toEqual([win(15)]);
        c2();
    });
});
