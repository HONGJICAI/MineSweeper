import React from "react";

type PlayHistoryEntry = {
  result: "Win" | "Loss";
  time: number;
  date?: string;
  difficulty: string;
};

export default function HistoryList({ playHistory }: { playHistory: PlayHistoryEntry[] }) {
  return (
    <div className="mt-4 w-full">
      <h2 className="text-lg font-semibold mb-2">History</h2>
      <ul className="space-y-1">
        {playHistory.length === 0 && <li className="text-gray-500">No games played yet.</li>}
        {playHistory.map((entry, idx) => (
          <li key={idx} className="flex justify-between text-sm">
            <span>
              {entry.result} ({entry.difficulty})
            </span>
            <span>
              {entry.time}s {entry.date && <span className="text-gray-400">({entry.date})</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}