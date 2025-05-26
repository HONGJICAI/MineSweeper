import React from "react";
import type { LeaderboardEntry } from "./useLeaderboard";

type Difficulty = "easy" | "medium" | "hard";

export default function Leaderboard({
  leaderboards,
  difficulty,
}: {
  leaderboards: Record<Difficulty, LeaderboardEntry[]>;
  difficulty: Difficulty;
}) {
  return (
    <div className="mt-6 w-full max-w-xs flex-shrink-0 min-w-[220px]">
      <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
        Leaderboard ({difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})
      </h2>
      <ol className="list-decimal list-inside bg-gray-100 dark:bg-gray-800 rounded p-3">
        {leaderboards[difficulty].length === 0 && (
          <li className="text-gray-500 dark:text-gray-400">No records yet.</li>
        )}
        {leaderboards[difficulty].map((entry, idx) => (
          <li key={idx} className="flex justify-between">
            <span>{entry.time}s</span>
            <span className="text-xs text-gray-400 ml-2">{entry.date}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}