import { useCallback } from "react";
import { useLocalStorage } from "./useStorage";
import { Difficulty, PlayHistory } from "../Game.types";

export type Leaderboards = {
    easy: PlayHistory[];
    medium: PlayHistory[];
    hard: PlayHistory[];
};

export function useLeaderboard() {
    const [leaderboards, setLeaderboards] = useLocalStorage<Leaderboards>(
        "leaderboards",
        {
            easy: [],
            medium: [],
            hard: [],
        }
    );

    const addLeaderboard = useCallback(
        (difficulty: Difficulty, entry: PlayHistory) => {
            if (leaderboards === null) return;
            const newLeaderboards = { ...leaderboards };
            const existingEntries = newLeaderboards[difficulty] || [];
            existingEntries.push(entry);
            // Sort entries by time (ascending) then date (ascending)
            existingEntries.sort((a, b) => {
                if (a.time !== b.time) {
                    return a.time - b.time; // Sort by time first
                }
                return new Date(a.date).getTime() - new Date(b.date).getTime(); // Then by date
            });
            // Keep only the top entries
            newLeaderboards[difficulty] = existingEntries.slice(0, 3);
            setLeaderboards(newLeaderboards);
        },
        [leaderboards, setLeaderboards]
    );

    const clearLeaderboard = useCallback(() => {
        setLeaderboards({
            easy: [],
            medium: [],
            hard: [],
        });
    }, [setLeaderboards]);

    return { leaderboards, addLeaderboard, clearLeaderboard };
}