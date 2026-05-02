import type { Difficulty, PlayHistory } from "@caiji-games/minesweeper-core";
import { untrack } from "svelte";
import { Achievement, type AchievementKey } from "../lib/achievement";
import { setAchievements } from "../lib/platform";
import { persistedState } from "./storage.svelte";

export type PlayHistoryMap = {
    easy: PlayHistory[];
    medium: PlayHistory[];
    hard: PlayHistory[];
};

const defaultMap: PlayHistoryMap = { easy: [], medium: [], hard: [] };

const fastThreshold: Record<Difficulty, number> = { easy: 9, medium: 55, hard: 200 };
const stepsThreshold: Record<Difficulty, number> = { easy: 15, medium: 85, hard: 300 };

const achievementMap = {
    complete: {
        easy: Achievement.completeEasyMode,
        medium: Achievement.completeMediumMode,
        hard: Achievement.completeHardMode,
    },
    fast: {
        easy: Achievement.completeEasyModeFast,
        medium: Achievement.completeMediumModeFast,
        hard: Achievement.completeHardModeFast,
    },
    perfect: {
        easy: Achievement.completeEasyModePerfect,
        medium: Achievement.completeMediumModePerfect,
        hard: Achievement.completeHardModePerfect,
    },
    lessSteps: {
        easy: Achievement.completeEasyModeLessSteps,
        medium: Achievement.completeMediumModeLessSteps,
        hard: Achievement.completeHardModeLessSteps,
    },
    withoutFlag: {
        easy: Achievement.completeEasyModeWithoutFlag,
        medium: Achievement.completeMediumModeWithoutFlag,
        hard: Achievement.completeHardModeWithoutFlag,
    },
} as const;

function checkAchievements(difficulty: Difficulty, history: PlayHistory): AchievementKey[] {
    if (history.result !== "Win") return [];
    const ret: AchievementKey[] = [achievementMap.complete[difficulty]];
    if (history.time <= fastThreshold[difficulty]) ret.push(achievementMap.fast[difficulty]);
    if (history.actions.every(a => a.score > 0)) ret.push(achievementMap.perfect[difficulty]);
    if (history.actions.length <= stepsThreshold[difficulty]) ret.push(achievementMap.lessSteps[difficulty]);
    if (history.actions.filter(a => a.type === "flag").length === 0)
        ret.push(achievementMap.withoutFlag[difficulty]);
    return ret;
}

export function createPlayHistoryState() {
    const persisted = persistedState<PlayHistoryMap>("playHistoryMap", defaultMap);

    function addEntry(difficulty: Difficulty, entry: PlayHistory) {
        // untrack so any tracking-context caller (e.g. App.svelte's $effect) doesn't
        // pick up persisted.value as a dep — that creates a self-triggering loop.
        untrack(() => {
            const next: PlayHistoryMap = {
                easy: [...persisted.value.easy],
                medium: [...persisted.value.medium],
                hard: [...persisted.value.hard],
            };
            const unlocked = checkAchievements(difficulty, entry);
            if (unlocked.length > 0) setAchievements(unlocked);
            next[difficulty] = [entry, ...next[difficulty]].slice(0, 100);
            persisted.value = next;
        });
    }

    function clear() {
        untrack(() => {
            persisted.value = { easy: [], medium: [], hard: [] };
        });
    }

    return {
        get map() { return persisted.value; },
        addEntry,
        clear,
    };
}

export type PlayHistoryState = ReturnType<typeof createPlayHistoryState>;
