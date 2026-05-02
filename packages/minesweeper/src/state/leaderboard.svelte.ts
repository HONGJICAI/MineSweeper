import type { Difficulty, PlayHistory } from "@caiji-games/minesweeper-core";
import { untrack } from "svelte";
import { persistedState } from "./storage.svelte";

export type Leaderboards = {
    easy: PlayHistory[];
    medium: PlayHistory[];
    hard: PlayHistory[];
};

const empty: Leaderboards = { easy: [], medium: [], hard: [] };

export function createLeaderboardState() {
    const persisted = persistedState<Leaderboards>("leaderboards", empty);

    function add(difficulty: Difficulty, entry: PlayHistory) {
        untrack(() => {
            const existing = [...persisted.value[difficulty], entry].sort((a, b) => {
                if (a.time !== b.time) return a.time - b.time;
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            });
            const next: Leaderboards = {
                easy: [...persisted.value.easy],
                medium: [...persisted.value.medium],
                hard: [...persisted.value.hard],
            };
            next[difficulty] = existing.slice(0, 3);
            persisted.value = next;
        });
    }

    function clear() {
        untrack(() => {
            persisted.value = { easy: [], medium: [], hard: [] };
        });
    }

    return {
        get boards() { return persisted.value; },
        add,
        clear,
    };
}

export type LeaderboardState = ReturnType<typeof createLeaderboardState>;
