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
