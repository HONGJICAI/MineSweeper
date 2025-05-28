import React, { useState, useCallback } from "react";
import { Button } from "./components/Button";
import { PlayHistory } from "./usePlayHistory";
import { Difficulty } from "./Game.types";

const StatisticsModal = React.memo(function StatisticsModal({
    show,
    onClose,
    playHistory,
}: {
    show: boolean;
    onClose: () => void;
    playHistory: PlayHistory[];
}) {
    const [showHistory, setShowHistory] = useState<{ [key in Difficulty]?: boolean }>({
        easy: true,
        medium: true,
        hard: true,
    });

    const toggleEasy = useCallback(
        () => setShowHistory((prev) => ({ ...prev, easy: !prev.easy })),
        []
    );
    const toggleMedium = useCallback(
        () => setShowHistory((prev) => ({ ...prev, medium: !prev.medium })),
        []
    );
    const toggleHard = useCallback(
        () => setShowHistory((prev) => ({ ...prev, hard: !prev.hard })),
        []
    );

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
                    <Button onClick={toggleEasy} active={showHistory.easy}>
                        Easy
                    </Button>
                    <Button onClick={toggleMedium} active={showHistory.medium}>
                        Medium
                    </Button>
                    <Button onClick={toggleHard} active={showHistory.hard}>
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
});

export default StatisticsModal;