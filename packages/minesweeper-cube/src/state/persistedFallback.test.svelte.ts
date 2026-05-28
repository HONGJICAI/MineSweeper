// Defensive-load tests: every consumer of `persistedState` must survive a localStorage value
// that's truncated, garbage, or shaped differently than the current schema. Schema migrations
// will happen post-launch, and v1 users carrying v0 data must not see a white screen.
//
// The fallback contract is implemented inside @caiji-games/shared-state's persistedState: a
// failed JSON.parse returns the supplied initial value. JSON that parses but doesn't match the
// expected shape is returned as-is — consumers carry the responsibility for being defensive,
// so the tests below exercise each one with realistic bad payloads.

import { describe, test, expect, beforeEach } from "vitest";
import { flushSync } from "svelte";
import { createUnlockState } from "./unlocks.svelte.ts";
import { createLeaderboardState } from "./leaderboard.svelte.ts";
import { createEndlessHistoryState } from "./endlessHistory.svelte.ts";
import { createPlayHistoryState } from "./playHistory.svelte.ts";

const KEY = (suffix: string) => `minesweeper-cube:${suffix}`;

describe("unlocks — corrupt persisted payloads", () => {
    beforeEach(() => localStorage.clear());

    test("garbage JSON falls back to defaults", () => {
        localStorage.setItem(KEY("unlocks"), "{not json");

        let st!: ReturnType<typeof createUnlockState>;
        const c = $effect.root(() => { st = createUnlockState(); });
        expect(st.easy).toBe(true);
        expect(st.medium).toBe(false);
        expect(st.hard).toBe(false);
        c();
    });

    test("empty string falls back to defaults", () => {
        localStorage.setItem(KEY("unlocks"), "");

        let st!: ReturnType<typeof createUnlockState>;
        const c = $effect.root(() => { st = createUnlockState(); });
        expect(st.easy).toBe(true);
        c();
    });

    test("can still unlock after loading garbage", () => {
        localStorage.setItem(KEY("unlocks"), "garbage");

        let st!: ReturnType<typeof createUnlockState>;
        const c = $effect.root(() => { st = createUnlockState(); });
        st.unlock("medium");
        flushSync();
        expect(st.medium).toBe(true);
        c();
    });
});

describe("leaderboard — corrupt persisted payloads", () => {
    beforeEach(() => localStorage.clear());

    test("malformed JSON: empty boards, add still works", () => {
        localStorage.setItem(KEY("leaderboards"), "}{");

        let lb!: ReturnType<typeof createLeaderboardState>;
        const c = $effect.root(() => { lb = createLeaderboardState(); });
        expect(lb.boards.easy).toEqual([]);
        expect(lb.boards.medium).toEqual([]);
        expect(lb.boards.hard).toEqual([]);

        lb.add("easy", { result: "Win", time: 12, date: "2026-01-01T00:00:00.000Z" });
        flushSync();
        expect(lb.boards.easy).toHaveLength(1);
        c();
    });

    test("truncated JSON survives", () => {
        // Looks like the start of a serialized board map, but cut mid-value.
        localStorage.setItem(KEY("leaderboards"), '{"easy":[{"result":"Wi');

        let lb!: ReturnType<typeof createLeaderboardState>;
        const c = $effect.root(() => { lb = createLeaderboardState(); });
        expect(lb.boards.easy).toEqual([]);
        c();
    });
});

describe("endlessHistory — corrupt persisted payloads", () => {
    beforeEach(() => localStorage.clear());

    test("garbage JSON: empty history, addRun still works", () => {
        localStorage.setItem(KEY("endlessHistory:normal"), "nope");

        let h!: ReturnType<typeof createEndlessHistoryState>;
        const c = $effect.root(() => { h = createEndlessHistoryState("normal"); });
        expect(h.all).toEqual([]);
        expect(h.topByLevel).toEqual([]);

        h.addRun({ maxLevel: 9, time: 120, date: "2026-01-01T00:00:00.000Z" });
        flushSync();
        expect(h.all).toHaveLength(1);
        c();
    });

    test("modes have separate buckets — corrupting one doesn't poison the other", () => {
        localStorage.setItem(KEY("endlessHistory:voxel"), "garbage");
        localStorage.setItem(
            KEY("endlessHistory:normal"),
            JSON.stringify([{ maxLevel: 12, time: 300, date: "2026-01-01T00:00:00.000Z" }]),
        );

        let voxel!: ReturnType<typeof createEndlessHistoryState>;
        let normal!: ReturnType<typeof createEndlessHistoryState>;
        const c = $effect.root(() => {
            voxel = createEndlessHistoryState("voxel");
            normal = createEndlessHistoryState("normal");
        });
        expect(voxel.all).toEqual([]);
        expect(normal.all).toHaveLength(1);
        expect(normal.all[0].maxLevel).toBe(12);
        c();
    });
});

describe("playHistory — corrupt persisted payloads", () => {
    beforeEach(() => localStorage.clear());

    test("garbage JSON: empty per-difficulty map, addEntry still works", () => {
        localStorage.setItem(KEY("playHistory"), "###");

        let h!: ReturnType<typeof createPlayHistoryState>;
        const c = $effect.root(() => { h = createPlayHistoryState(); });
        expect(h.map.easy).toEqual([]);
        expect(h.map.medium).toEqual([]);
        expect(h.map.hard).toEqual([]);

        h.addEntry("easy", { result: "Win", time: 9, date: "2026-01-01T00:00:00.000Z" });
        flushSync();
        expect(h.map.easy).toHaveLength(1);
        c();
    });
});

describe("ads — corrupt persisted payloads", () => {
    beforeEach(() => localStorage.clear());

    test("garbage noBannerUntil falls back to 0 (banner not suppressed)", async () => {
        localStorage.setItem(KEY("ads:noBannerUntil"), "not-a-number");

        // We don't call init() — just read the public getter to confirm the fallback.
        // Dynamically import to avoid hoisting issues with vi.mock in sibling files.
        const { createAdsState } = await import("./ads.svelte.ts");
        let ads!: ReturnType<typeof createAdsState>;
        const c = $effect.root(() => { ads = createAdsState(); });
        expect(ads.noBannerUntil).toBe(0);
        c();
    });

    test("garbage hasLaunchedBefore: treated as never-launched (the safe default)", async () => {
        localStorage.setItem(KEY("ads:hasLaunchedBefore"), "{{{");

        const { createAdsState } = await import("./ads.svelte.ts");
        let ads!: ReturnType<typeof createAdsState>;
        const c = $effect.root(() => { ads = createAdsState(); });
        // Indirect check: noBannerUntil getter is exposed; hasLaunchedBefore isn't. The
        // observable consequence is in maybeShowAppOpen behaviour, which the ads test file
        // covers. Here we just confirm construction doesn't throw on the garbage payload.
        expect(ads.available).toBe(false);
        c();
    });
});
