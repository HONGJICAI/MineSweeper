import React, { useState, useCallback, useMemo } from "react";
import { Button } from "./components/Button";
import { PlayHistory } from "./usePlayHistory";
import { Difficulty } from "./Game.types";

const StatisticsModal = React.memo(function StatisticsModal({
    show,
    onClose,
    playHistory,
    onClearHistory,
}: {
    show: boolean;
    onClose: () => void;
    playHistory: PlayHistory[];
    onClearHistory?: () => void;
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

    const handleClearHistory = useCallback(() => {
        if (window.confirm("Are you sure you want to clear all play history?")) {
            onClearHistory?.();
        }
    }, [onClearHistory]);

    // Calculate statistics
    const statistics = useMemo(() => {
        const stats: { [key in Difficulty]: { wins: number; total: number; rate: number } } = {
            easy: { wins: 0, total: 0, rate: 0 },
            medium: { wins: 0, total: 0, rate: 0 },
            hard: { wins: 0, total: 0, rate: 0 },
        };

        playHistory.forEach((entry) => {
            stats[entry.difficulty].total++;
            if (entry.result === "Win") {
                stats[entry.difficulty].wins++;
            }
        });

        // Calculate success rates
        Object.keys(stats).forEach((difficulty) => {
            const diff = difficulty as Difficulty;
            if (stats[diff].total > 0) {
                stats[diff].rate = Math.round((stats[diff].wins / stats[diff].total) * 100);
            }
        });

        return stats;
    }, [playHistory]);

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
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Game Statistics</h2>
                
                {/* Success Rate Statistics */}
                <div className="mb-6 grid grid-cols-3 gap-4">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((difficulty) => (
                        <div key={difficulty} className="text-center">
                            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 capitalize">
                                {difficulty}
                            </h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {statistics[difficulty].rate}%
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                                {statistics[difficulty].wins}/{statistics[difficulty].total}
                            </p>
                        </div>
                    ))}
                </div>

                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Recent Games</h3>
                
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
                
                <div className="max-h-64 overflow-y-auto">
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

                {/* Clear History Button */}
                {playHistory.length > 0 && onClearHistory && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleClearHistory}
                            className="text-sm text-white bg-red-600 hover:scale-1.05 rounded-md px-3 py-1 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Clear All History
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

export default StatisticsModal;