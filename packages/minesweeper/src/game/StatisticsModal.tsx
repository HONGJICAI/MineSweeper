import React, { useCallback, useMemo, useState } from "react";
import { Difficulty, DifficultyText } from "./Game.types";
import { PlayHistoryMap } from "./hooks/usePlayHistory";
import { Button, Modal } from "@caiji-games/shared-ui";

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
    const [confirmAction, setConfirmAction] = useState<"history" | "leaderboard" | null>(null);

    const handleClearHistory = useCallback(() => setConfirmAction("history"), []);
    const handleClearLeaderboard = useCallback(() => setConfirmAction("leaderboard"), []);
    const cancelClear = useCallback(() => setConfirmAction(null), []);
    const confirmClear = useCallback(() => {
        if (confirmAction === "history") {
            onClearHistory?.();
        } else if (confirmAction === "leaderboard") {
            onClearLeaderboard?.();
        }
        setConfirmAction(null);
    }, [confirmAction, onClearHistory, onClearLeaderboard]);

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
            stats[diff].wins = history.filter(entry => entry.result === "Win").length;
        });

        Object.keys(stats).forEach((difficulty) => {
            const diff = difficulty as Difficulty;
            if (stats[diff].total > 0) {
                stats[diff].rate = Math.round((stats[diff].wins / stats[diff].total) * 100);
            }
        });

        return stats;
    }, [playHistoryMap]);

    return (
        <Modal show={show} onClose={onClose} title="Game Statistics">
            <div className="mb-6 grid grid-cols-3 gap-4">
                {(["easy", "medium", "hard"] as Difficulty[]).map((difficulty) => (
                    <div key={difficulty} className="text-center">
                        <div className="text-2xl mb-1">{DifficultyText[difficulty]}</div>
                        <p className="text-2xl font-mono font-bold text-gray-900 dark:text-gray-100">
                            {statistics[difficulty].rate}%
                        </p>
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-500">
                            {statistics[difficulty].wins}/{statistics[difficulty].total}
                        </p>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2 flex-wrap">
                {onClearHistory && (
                    <Button variant="danger" size="sm" onClick={handleClearHistory}>
                        Clear Game History
                    </Button>
                )}
                {onClearLeaderboard && (
                    <Button variant="danger" size="sm" onClick={handleClearLeaderboard}>
                        Clear Leaderboard
                    </Button>
                )}
            </div>

            {/* Confirm overlay — sits on top of the modal content, not a separate fixed modal */}
            {confirmAction && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Clear {confirmAction === "history" ? "History" : "Leaderboard"}?
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Are you sure? This action cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <Button onClick={cancelClear}>Cancel</Button>
                            <Button variant="danger" onClick={confirmClear}>Clear</Button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
});

export default StatisticsModal;
