import type { Difficulty } from "@caiji-games/minesweeper-cube-core";
import { untrack } from "svelte";
import { persistedState } from "./persisted.ts";
import { emptyByDifficulty, type ByDifficulty, type CubeHistoryEntry } from "./historyTypes.ts";

// Keep the most recent N games per difficulty; older ones get dropped.
const KEEP_PER_DIFFICULTY = 30;

export function createPlayHistoryState() {
    const persisted = persistedState<ByDifficulty<CubeHistoryEntry>>("playHistory", emptyByDifficulty());

    function addEntry(difficulty: Difficulty, entry: CubeHistoryEntry) {
        untrack(() => {
            persisted.value = {
                ...persisted.value,
                [difficulty]: [entry, ...persisted.value[difficulty]].slice(0, KEEP_PER_DIFFICULTY),
            };
        });
    }

    function clear() {
        untrack(() => {
            persisted.value = emptyByDifficulty();
        });
    }

    return {
        get map() { return persisted.value; },
        addEntry,
        clear,
    };
}

export type PlayHistoryState = ReturnType<typeof createPlayHistoryState>;
