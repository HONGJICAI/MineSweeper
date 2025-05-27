import { useCallback } from "react";
import { useLocalStorage } from "./useStorage";

type Difficulty = "easy" | "medium" | "hard";

export type LeaderboardEntry = {
    time: number;
    date: string;
};

type Leaderboards = {
    easy: LeaderboardEntry[];
    medium: LeaderboardEntry[];
    hard: LeaderboardEntry[];
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

    const addEntry = useCallback(
        (difficulty: Difficulty, entry: LeaderboardEntry) => {
            if (leaderboards === null) return;
            const newLeaderboards = { ...leaderboards };
            const existingEntries = newLeaderboards[difficulty] || [];
            // Add the new entry and sort by time
            existingEntries.push(entry);
            existingEntries.sort((a, b) => a.time - b.time);
            // Keep only the top entries
            newLeaderboards[difficulty] = existingEntries.slice(0, 3);
            setLeaderboards(newLeaderboards);
        },
        [leaderboards, setLeaderboards]
    );

    return { leaderboards, addEntry };
}