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
//
// VITE_UNLOCK_ALL=1 unlocks everything for the duration of a build. It exists because testing
// anything gated behind progression otherwise means winning a real Easy game, then a real Medium
// one, before Hard or endless can even be opened.
//
// Two deliberate properties:
//   - It overrides on *read* and never writes to storage, so a build without the flag drops
//     straight back to the player's real progress instead of leaving them permanently unlocked.
//   - Vite inlines the comparison at build time, so a release build (where the variable is unset)
//     folds this to `false || …` and the branch disappears entirely. The release workflow never
//     sets it; see scripts/admob-env.local.sh for the same pattern applied to the ads debug knobs.
const UNLOCK_ALL = import.meta.env.VITE_UNLOCK_ALL === "1";

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
        return UNLOCK_ALL || persisted.value[d];
    }

    return {
        get easy()    { return UNLOCK_ALL || persisted.value.easy; },
        get medium()  { return UNLOCK_ALL || persisted.value.medium; },
        get hard()    { return UNLOCK_ALL || persisted.value.hard; },
        // Endless shares the gate with Hard: requires beating Medium first.
        get endless() { return UNLOCK_ALL || persisted.value.hard; },
        unlock,
        isUnlocked,
    };
}

export type UnlockState = ReturnType<typeof createUnlockState>;
