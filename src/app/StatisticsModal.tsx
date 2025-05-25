import React, { useState } from "react";
import { Button } from "./components/Button";

type Difficulty = "easy" | "medium" | "hard";

type PlayHistoryEntry = {
    result: "Win" | "Loss";
    time: number;
    date: string;
    difficulty: Difficulty;
};

export default function StatisticsModal({
    show,
    onClose,
    playHistory,
}: {
    show: boolean;
    onClose: () => void;
    playHistory: PlayHistoryEntry[];
}) {
    const [showHistory, setShowHistory] = useState<{ [key in Difficulty]?: boolean }>({
        easy: true,
        medium: true,
        hard: true,
    });

    if (!show) return null;

    const filteredHistory = playHistory.filter((entry) => showHistory[entry.difficulty]);

    return (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md relative">
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ✖️
                </button>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Recent Play History</h2>
                {/* Filter Buttons */}
                <div className="flex gap-2 mb-4">
                    <Button onClick={() => setShowHistory({ ...showHistory, easy: !showHistory.easy })} active={showHistory.easy}>
                        Easy
                    </Button>
                    <Button onClick={() => setShowHistory({ ...showHistory, medium: !showHistory.medium })} active={showHistory.medium}>
                        Medium
                    </Button>
                    <Button onClick={() => setShowHistory({ ...showHistory, hard: !showHistory.hard })} active={showHistory.hard}>
                        Hard
                    </Button>
                </div>
                {filteredHistory.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No games played yet.</p>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredHistory.map((entry, idx) => (
                            <li key={idx} className="py-2 flex justify-between items-center">
                                <span>
                                    <span className={entry.result === "Win" ? "text-green-600" : "text-red-600"}>
                                        {entry.result}
                                    </span>
                                    {" "}({entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)})
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{entry.time}s</span>
                                <span className="text-xs text-gray-400 ml-2">{entry.date}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}