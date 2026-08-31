import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { flushSync } from "svelte";
import { createUnlockState, type UnlockState } from "./unlocks.svelte.ts";

describe("createUnlockState", () => {
    let unlocks!: UnlockState;
    let cleanup!: () => void;

    beforeEach(() => {
        localStorage.clear();
        cleanup = $effect.root(() => {
            unlocks = createUnlockState();
        });
    });

    afterEach(() => {
        cleanup();
    });

    test("initial state: easy unlocked, others locked", () => {
        expect(unlocks.easy).toBe(true);
        expect(unlocks.medium).toBe(false);
        expect(unlocks.hard).toBe(false);
        expect(unlocks.endless).toBe(false);
    });

    test("unlock(medium) flips medium to true", () => {
        unlocks.unlock("medium");
        flushSync();
        expect(unlocks.medium).toBe(true);
        expect(unlocks.hard).toBe(false);
    });

    test("unlock is idempotent", () => {
        unlocks.unlock("hard");
        flushSync();
        unlocks.unlock("hard");
        flushSync();
        expect(unlocks.hard).toBe(true);
    });

    test("endless gates with hard, not medium", () => {
        unlocks.unlock("medium");
        flushSync();
        expect(unlocks.endless).toBe(false);
        unlocks.unlock("hard");
        flushSync();
        expect(unlocks.endless).toBe(true);
    });

    test("isUnlocked reflects flag state", () => {
        expect(unlocks.isUnlocked("easy")).toBe(true);
        expect(unlocks.isUnlocked("medium")).toBe(false);
        unlocks.unlock("medium");
        flushSync();
        expect(unlocks.isUnlocked("medium")).toBe(true);
    });
});

describe("createUnlockState persistence", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test("writes through to localStorage and rehydrates a fresh instance", () => {
        const cleanup1 = $effect.root(() => {
            const u1 = createUnlockState();
            u1.unlock("medium");
            u1.unlock("hard");
        });
        flushSync();
        cleanup1();

        let u2!: UnlockState;
        const cleanup2 = $effect.root(() => {
            u2 = createUnlockState();
        });
        expect(u2.medium).toBe(true);
        expect(u2.hard).toBe(true);
        expect(u2.endless).toBe(true);
        cleanup2();
    });

    test("VITE_UNLOCK_ALL is off in the test environment, so gates apply normally", () => {
        // The flag is a build-time debug escape hatch. If it ever leaked into a normal build the
        // whole progression system would silently vanish, and every other test in this file would
        // still pass because they only assert on the unlocked side. This one fails loudly instead.
        const cleanup = $effect.root(() => {
            const u = createUnlockState();
            expect(u.easy).toBe(true);
            expect(u.medium).toBe(false);
            expect(u.hard).toBe(false);
            expect(u.endless).toBe(false);
            expect(u.isUnlocked("hard")).toBe(false);
        });
        cleanup();
    });

    test("reading a gate never persists an unlock", () => {
        // The override applies on read only. A build with VITE_UNLOCK_ALL set, followed by one
        // without, has to drop back to the player's real progress -- if reading ever wrote the
        // unlocked value through, they would stay unlocked forever.
        //
        // Note persistedState writes its initial value on construction, so the assertion is that
        // the *stored flags* are still false, not that nothing was written at all.
        const cleanup = $effect.root(() => {
            const u = createUnlockState();
            void u.hard;
            void u.endless;
            void u.isUnlocked("medium");
        });
        flushSync();
        const stored = JSON.parse(localStorage.getItem("minesweeper-cube:unlocks") ?? "{}");
        expect(stored.medium).toBe(false);
        expect(stored.hard).toBe(false);
        cleanup();
    });

    test("uses the minesweeper-cube: namespace prefix", () => {
        const cleanup = $effect.root(() => {
            const u = createUnlockState();
            u.unlock("medium");
        });
        flushSync();
        // Catches future regressions where someone re-points unlocks at the bare persistedState
        // (would collide with other apps on the same origin).
        expect(localStorage.getItem("minesweeper-cube:unlocks")).not.toBeNull();
        expect(localStorage.getItem("unlocks")).toBeNull();
        cleanup();
    });
});
