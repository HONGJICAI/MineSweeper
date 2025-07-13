import React, { useCallback, useMemo, useState } from "react";
import { Difficulty, DifficultyText } from "./Game.types";
import { PlayHistoryMap } from "./hooks/usePlayHistory";
const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
}

// Helper function to calculate localStorage size
const getLocalStorageSize = (): { used: number; percentage: number; formatted: string } => {
    let totalSize = 0;
    try {
        for (const key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }
    } catch (e) {
        console.error('Error calculating localStorage size:', e);
    }

    // Convert to KB/MB
    const sizeInKB = totalSize / 1024;
    const sizeInMB = sizeInKB / 1024;
    const maxSizeMB = 5; // 5MB max for most browsers
    const percentage = Math.round((sizeInMB / maxSizeMB) * 100);

    let formatted = '';
    if (sizeInMB >= 1) {
        formatted = `${sizeInMB.toFixed(2)} MB`;
    } else {
        formatted = `${sizeInKB.toFixed(2)} KB`;
    }

    return { used: sizeInMB, percentage, formatted };
};

const StatisticsModal = React.memo(function StatisticsModal({
    show,
    onClose,
    playHistoryMap,
    onClearHistory,
    onClearLeaderboard,
}: {
    show: boolean;
    onClose: () => void;
    playHistoryMap: PlayHistoryMap;
    onClearHistory?: () => void;
    onClearLeaderboard?: () => void;
}) {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<'history' | 'leaderboard' | null>(null);

    const handleClearHistory = useCallback(() => {
        setConfirmAction('history');
        setShowConfirmDialog(true);
    }, []);

    const handleClearLeaderboard = useCallback(() => {
        setConfirmAction('leaderboard');
        setShowConfirmDialog(true);
    }, []);

    const confirmClear = useCallback(() => {
        if (confirmAction === 'history') {
            onClearHistory?.();
        } else if (confirmAction === 'leaderboard') {
            onClearLeaderboard?.();
        }
        setShowConfirmDialog(false);
        setConfirmAction(null);
    }, [confirmAction, onClearHistory, onClearLeaderboard]);

    const cancelClear = useCallback(() => {
        setShowConfirmDialog(false);
        setConfirmAction(null);
    }, []);

    // Calculate statistics
    const statistics = useMemo(() => {
        const stats: { [key in Difficulty]: { wins: number; total: number; rate: number } } = {
            easy: { wins: 0, total: 0, rate: 0 },
            medium: { wins: 0, total: 0, rate: 0 },
            hard: { wins: 0, total: 0, rate: 0 },
        };

        Object.keys(playHistoryMap).forEach((difficulty) => {
            const diff = difficulty as Difficulty;
            const history = playHistoryMap[diff] || [];
            stats[diff].total = history.length;
            stats[diff].wins = history.filter(entry => entry.result === 'Win').length;
        });

        // Calculate success rates
        Object.keys(stats).forEach((difficulty) => {
            const diff = difficulty as Difficulty;
            if (stats[diff].total > 0) {
                stats[diff].rate = Math.round((stats[diff].wins / stats[diff].total) * 100);
            }
        });

        return stats;
    }, [playHistoryMap]);

    // Calculate storage usage
    const storageInfo = getLocalStorageSize();

    if (!show) return null;

    return (
        <div
            className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-h-full max-w-md relative"
                onClick={stopPropagation}
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

                {/* Storage Usage */}
                <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Storage Usage</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{storageInfo.formatted} / 5 MB</span>
                    </div>
                    <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${storageInfo.percentage > 80 ? 'bg-red-600' :
                                    storageInfo.percentage > 60 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                }`}
                            style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {storageInfo.percentage}% of available storage used
                    </p>
                </div>

                {/* Clear Buttons */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-wrap">
                    {onClearHistory && (
                        <button
                            onClick={handleClearHistory}
                            className="text-sm text-white bg-red-600 hover:scale-105 rounded-md px-3 py-1 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Clear Game History
                        </button>
                    )}
                    {onClearLeaderboard && (
                        <button
                            onClick={handleClearLeaderboard}
                            className="text-sm text-white bg-orange-600 hover:scale-105 rounded-md px-3 py-1 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                        >
                            Clear Leaderboard
                        </button>
                    )}
                </div>

                {/* Confirmation Dialog */}
                {showConfirmDialog && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 m-4 max-w-sm shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Clear {confirmAction === 'history' ? 'History' : 'Leaderboard'}?
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Are you sure you want to clear all {confirmAction === 'history' ? 'game history' : 'leaderboard entries'}? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={cancelClear}
                                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmClear}
                                    className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    Clear {confirmAction === 'history' ? 'History' : 'Leaderboard'}
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