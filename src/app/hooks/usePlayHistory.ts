import { useCallback } from "react";
import { useLocalStorage } from "./useStorage";
import { Difficulty, PlayHistory } from "../Game.types";
import { Achievement, activateAchievement } from '../utils/achievement'

function checkAchievement(history: PlayHistory): (keyof typeof Achievement)[] {
    const iteration = Number.parseInt(history.seed.split("-")[1]) || 1;
    const ret: (keyof typeof Achievement)[] = [];
    if (history.result === "Win") {
        if (iteration >= 2)
            ret.push(Achievement.completeAfterRetry);
    } else if (history.result === "Loss") {
        if (iteration >= 2)
            ret.push(Achievement.failedAfterRetry);
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
        const achievements = checkAchievement(entry);
        achievements.forEach(achievement => {
            if (achievement) {
                activateAchievement(achievement);
            }
        });
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