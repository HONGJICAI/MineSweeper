import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { flushSync } from "svelte";
import {
    createEndlessHistoryState,
    type EndlessHistoryState,
    type EndlessRun,
} from "./endlessHistory.svelte.ts";

const run = (maxLevel: number, time: number, date = "2026-01-01T00:00:00.000Z"): EndlessRun => ({
    maxLevel,
    time,
    date,
});

describe("createEndlessHistoryState (single sub-mode)", () => {
    let h!: EndlessHistoryState;
    let cleanup!: () => void;

    beforeEach(() => {
        localStorage.clear();
        cleanup = $effect.root(() => {
            h = createEndlessHistoryState("normal");
        });
    });

    afterEach(() => {
        cleanup();
    });

    test("initial: no runs", () => {
        expect(h.all).toEqual([]);
        expect(h.topByLevel).toEqual([]);
        expect(h.recent).toEqual([]);
    });

    test("addRun prepends so newest is first in `all`", () => {
        h.addRun(run(7, 30));
        h.addRun(run(9, 60));
        flushSync();
        expect(h.all.map(r => r.maxLevel)).toEqual([9, 7]);
    });

    test("topByLevel sorts by maxLevel desc, ties broken by faster time", () => {
        h.addRun(run(7, 30));
        h.addRun(run(11, 100));
        h.addRun(run(9, 50));
        h.addRun(run(11, 80));   // same level as the second — faster, should come first
        h.addRun(run(9, 40));
        flushSync();
        const ranked = h.topByLevel.map(r => ({ lvl: r.maxLevel, t: r.time }));
        expect(ranked).toEqual([
            { lvl: 11, t: 80 },
            { lvl: 11, t: 100 },
            { lvl: 9,  t: 40 },
            { lvl: 9,  t: 50 },
            { lvl: 7,  t: 30 },
        ]);
    });

    test("topByLevel is capped at 5", () => {
        for (let i = 0; i < 8; i++) h.addRun(run(5 + i, 10));
        flushSync();
        expect(h.topByLevel).toHaveLength(5);
        // The five highest levels (12, 11, 10, 9, 8) survive.
        expect(h.topByLevel.map(r => r.maxLevel)).toEqual([12, 11, 10, 9, 8]);
    });

    test("recent returns the 10 most recently added", () => {
        for (let i = 0; i < 15; i++) h.addRun(run(7, i));
        flushSync();
        expect(h.recent).toHaveLength(10);
        // Newest first: time=14 was added last.
        expect(h.recent[0].time).toBe(14);
        expect(h.recent[9].time).toBe(5);
    });

    test("KEEP=50 caps total stored runs", () => {
        for (let i = 0; i < 60; i++) h.addRun(run(7, i));
        flushSync();
        expect(h.all).toHaveLength(50);
        // Oldest 10 fell off; the 50 most recent (time 10..59) survive, newest first.
        expect(h.all[0].time).toBe(59);
        expect(h.all[49].time).toBe(10);
    });

    test("clear() empties the history", () => {
        h.addRun(run(7, 30));
        flushSync();
        h.clear();
        flushSync();
        expect(h.all).toEqual([]);
    });
});

describe("createEndlessHistoryState sub-mode isolation", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test("normal and voxel use separate localStorage buckets", () => {
        const cleanup = $effect.root(() => {
            const normal = createEndlessHistoryState("normal");
            const voxel = createEndlessHistoryState("voxel");
            normal.addRun(run(9, 60));
            voxel.addRun(run(7, 40));
            flushSync();
            expect(normal.all.map(r => r.maxLevel)).toEqual([9]);
            expect(voxel.all.map(r => r.maxLevel)).toEqual([7]);
        });
        cleanup();
        // The two buckets must occupy distinct keys in storage.
        expect(localStorage.getItem("minesweeper-cube:endlessHistory:normal")).not.toBeNull();
        expect(localStorage.getItem("minesweeper-cube:endlessHistory:voxel")).not.toBeNull();
    });
});

describe("createEndlessHistoryState persistence", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test("rehydrates a saved run on remount", () => {
        const c1 = $effect.root(() => {
            const h1 = createEndlessHistoryState("voxel");
            h1.addRun(run(11, 200));
        });
        flushSync();
        c1();

        let h2!: EndlessHistoryState;
        const c2 = $effect.root(() => { h2 = createEndlessHistoryState("voxel"); });
        expect(h2.all).toEqual([run(11, 200)]);
        c2();
    });
});
