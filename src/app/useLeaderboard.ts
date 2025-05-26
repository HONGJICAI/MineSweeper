import { useState, useCallback } from "react";

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
  const [leaderboards, setLeaderboards] = useState<Leaderboards>({
    easy: [],
    medium: [],
    hard: [],
  });

  const addEntry = useCallback(
    (difficulty: Difficulty, entry: LeaderboardEntry) => {
      setLeaderboards((prev) => {
        const updated = { ...prev };
        updated[difficulty] = [...updated[difficulty], entry]
          .sort((a, b) => a.time - b.time)
          .slice(0, 5); // Keep top 5
        return updated;
      });
    },
    []
  );

  return { leaderboards, addEntry };
}