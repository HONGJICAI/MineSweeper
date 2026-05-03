import type { Difficulty } from "@caiji-games/minesweeper-cube-core";
import { untrack } from "svelte";
import { persistedState } from "./persisted.ts";
import { emptyByDifficulty, type ByDifficulty, type CubeHistoryEntry } from "./historyTypes.ts";

const TOP_N = 5;

export function createLeaderboardState() {
    const persisted = persistedState<ByDifficulty<CubeHistoryEntry>>("leaderboards", emptyByDifficulty());

    function add(difficulty: Difficulty, entry: CubeHistoryEntry) {
        if (entry.result !== "Win") return;
        // untrack so callers in $effect contexts don't capture persisted.value as a dep.
        untrack(() => {
            const merged = [...persisted.value[difficulty], entry].sort((a, b) => {
                if (a.time !== b.time) return a.time - b.time;
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            });
            persisted.value = {
                ...persisted.value,
                [difficulty]: merged.slice(0, TOP_N),
            };
        });
    }

    function clear() {
        untrack(() => {
            persisted.value = emptyByDifficulty();
        });
    }

    return {
        get boards() { return persisted.value; },
        add,
        clear,
    };
}

export type LeaderboardState = ReturnType<typeof createLeaderboardState>;
