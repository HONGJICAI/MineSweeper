import { untrack } from "svelte";
import { persistedState } from "./persisted.ts";

export type EndlessRun = {
    maxLevel: number;   // highest N (cube size) the player reached
    time: number;       // total seconds across the run
    date: string;       // ISO timestamp
};

const TOP_N = 5;
const KEEP = 50; // keep this many runs total; older ones drop off

export function createEndlessHistoryState() {
    const persisted = persistedState<EndlessRun[]>("endlessHistory", []);

    function addRun(run: EndlessRun) {
        untrack(() => {
            persisted.value = [run, ...persisted.value].slice(0, KEEP);
        });
    }

    function clear() {
        untrack(() => {
            persisted.value = [];
        });
    }

    return {
        get all() { return persisted.value; },
        // Best runs: highest level first; ties broken by faster time. Top 5.
        get topByLevel() {
            return [...persisted.value]
                .sort((a, b) => {
                    if (b.maxLevel !== a.maxLevel) return b.maxLevel - a.maxLevel;
                    return a.time - b.time;
                })
                .slice(0, TOP_N);
        },
        get recent() { return persisted.value.slice(0, 10); },
        addRun,
        clear,
    };
}

export type EndlessHistoryState = ReturnType<typeof createEndlessHistoryState>;
