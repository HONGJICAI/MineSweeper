import React, { useCallback, useMemo, useState } from "react";
import { Difficulty, DifficultyText, PlayHistory } from "./Game.types";

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
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const handleClearHistory = useCallback(() => {
        setShowConfirmDialog(true);
    }, []);

    const confirmClearHistory = useCallback(() => {
        onClearHistory?.();
        setShowConfirmDialog(false);
    }, [onClearHistory]);

    const cancelClearHistory = useCallback(() => {
        setShowConfirmDialog(false);
    }, []);

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

    return (
        <div 
            className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-h-full max-w-md relative"
                onClick={(e) => e.stopPropagation()}
            >
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
                                {DifficultyText[difficulty]}
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

                {/* Clear History Button */}
                {playHistory.length > 0 && onClearHistory && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleClearHistory}
                            className="text-sm text-white bg-red-600 hover:scale-105 rounded-md px-3 py-1 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Clear Game History
                        </button>
                    </div>
                )}

                {/* Confirmation Dialog */}
                {showConfirmDialog && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 m-4 max-w-sm shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Clear History?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Are you sure you want to clear all game history? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={cancelClearHistory}
                                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmClearHistory}
                                    className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    Clear History
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export default StatisticsModal;