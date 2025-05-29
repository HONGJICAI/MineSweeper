import React from "react";
import type { LeaderboardEntry } from "./useLeaderboard";
import { TitledDiv } from "./components/TitledDiv";
import { Difficulty } from "./Game.types";

export default function Leaderboard({
    leaderboards,
    difficulty,
}: {
    leaderboards: Record<Difficulty, LeaderboardEntry[]> | null;
    difficulty: Difficulty;
}) {
    return (
        <TitledDiv title={`Leaderboard (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`} className="w-full min-w-[220px]">
            <ol className="list-decimal list-inside rounded p-1 text-gray-500" >
                {leaderboards === null && (
                    <li className="">Loading...</li>
                )}
                {leaderboards?.[difficulty]?.length === 0 && (
                    <li className="text-gray-500">No entries yet.</li>
                )}
                {leaderboards?.[difficulty]?.map((entry, idx) => (
                    <li key={idx} className="flex justify-between dark:text-gray-300">
                        <span>{entry.time}s</span>
                        <span className="text-xs text-gray-400 ml-2">{entry.date}</span>
                    </li>
                ))}
            </ol>
        </TitledDiv>
    );
}