import { untrack } from "svelte";
import type { Difficulty } from "@caiji-games/minesweeper-cube-core";
import { persistedState } from "./persisted.ts";

// Progression gate: which classic difficulties + endless mode the player has earned access to.
// - Easy is always unlocked.
// - Medium unlocks once Easy is won.
// - Hard unlocks once Medium is won.
// - Endless (any sub-mode) unlocks once Medium is won — same gate as Hard, since the endless
//   curve starts at medium-tier density and would frustrate a beginner.
//
// Stored separately from the leaderboard so clearing the leaderboard doesn't re-lock content.
export type UnlockedFlags = {
    easy: boolean;
    medium: boolean;
    hard: boolean;
};

const initial: UnlockedFlags = { easy: true, medium: false, hard: false };

export function createUnlockState() {
    const persisted = persistedState<UnlockedFlags>("unlocks", initial);

    function unlock(d: Difficulty) {
        untrack(() => {
            if (persisted.value[d]) return;
            persisted.value = { ...persisted.value, [d]: true };
        });
    }

    function isUnlocked(d: Difficulty): boolean {
        return persisted.value[d];
    }

    return {
        get easy()    { return persisted.value.easy; },
        get medium()  { return persisted.value.medium; },
        get hard()    { return persisted.value.hard; },
        // Endless shares the gate with Hard: requires beating Medium first.
        get endless() { return persisted.value.hard; },
        unlock,
        isUnlocked,
    };
}

export type UnlockState = ReturnType<typeof createUnlockState>;
