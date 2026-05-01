import { useCallback } from "react";
import { useLocalStorage } from "./useStorage";
import { Difficulty, PlayHistory } from "../Game.types";
import { Achievement } from '../utils/achievement'
import { setAchievements } from "../utils/platform";

// Achievement thresholds by difficulty
const fastThreshold = { easy: 9, medium: 55, hard: 200 };
const stepsThreshold = { easy: 15, medium: 85, hard: 300 };

function checkAchievement(difficulty: Difficulty, history: PlayHistory): (keyof typeof Achievement)[] {
    const ret: (keyof typeof Achievement)[] = [];

    // Achievement key mappings by difficulty
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
        }
    };


    if (history.result === "Win") {

        // Basic completion
        ret.push(achievementMap.complete[difficulty]);

        // Speedrun
        if (history.time !== undefined && history.time <= fastThreshold[difficulty])
            ret.push(achievementMap.fast[difficulty]);

        // Perfect
        if (history.actions.every(e => e.score > 0))
            ret.push(achievementMap.perfect[difficulty]);

        // Less steps
        if (history.actions.length <= stepsThreshold[difficulty])
            ret.push(achievementMap.lessSteps[difficulty]);

        // Without flag
        if (history.actions.filter(e => e.type === "flag").length === 0)
            ret.push(achievementMap.withoutFlag[difficulty]);
    }
    return ret;
}

export type PlayHistoryMap = {
    easy: PlayHistory[];
    medium: PlayHistory[];
    hard: PlayHistory[];
};
const defaultPlayHistory: PlayHistoryMap = {
    easy: [],
    medium: [],
    hard: [],
};
export function usePlayHistory() {
    const [playHistoryMap, setPlayHistory] = useLocalStorage<PlayHistoryMap>(
        "playHistoryMap",
        defaultPlayHistory
    );

    // insert a new play history entry to head of the list
    const addPlayHistoryEntry = useCallback((difficulty: Difficulty, entry: PlayHistory) => {
        if (playHistoryMap === null) return;
        const newPlayHistory = { ...playHistoryMap };
        // Check for achievements
        const achievements = checkAchievement(difficulty, entry);
        setAchievements(achievements);
        // Insert the new entry at the beginning of the list for the specified difficulty
        newPlayHistory[difficulty] = [entry, ...(newPlayHistory[difficulty] || [])];
        // max size is 100
        newPlayHistory[difficulty] = newPlayHistory[difficulty].slice(0, 100);
        setPlayHistory(newPlayHistory);
    }, [playHistoryMap, setPlayHistory]);

    const clearPlayHistory = useCallback(() => {
        setPlayHistory(defaultPlayHistory);
    }, [setPlayHistory]);

    return { playHistoryMap, addPlayHistoryEntry, clearPlayHistory };
}