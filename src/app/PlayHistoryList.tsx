import React, { useCallback, useState } from "react";
import { Difficulty, DifficultyText, PlayHistory, Position, UserActionDetail } from "./Game.types";

interface HistoryListProps {
    playHistory: PlayHistory[] | null;
    onRetry: (seed: string, difficulty: Difficulty, firstStep: Position) => void;
    onReplay: (seed: string, difficulty: Difficulty, actions: UserActionDetail[]) => void;
}

const PlayHistoryList = React.memo(function HistoryList({ playHistory, onRetry, onReplay }: HistoryListProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(playHistory?.length ?? 0 > 0 ? 0 : null);

    const handleItemClick = useCallback((index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    }, [expandedIndex]);

    const handleRetry = useCallback((entry: PlayHistory) => {
        const firstStep = entry.actions.at(0)?.position;
        if (!firstStep) {
            console.warn("No first step available for replay.");
            return;
        }
        onRetry(entry.seed, entry.difficulty, firstStep);
    }, [onRetry]);

    const handleReplay = useCallback((entry: PlayHistory) => {
        onReplay(entry.seed, entry.difficulty, entry.actions);
    }, [onReplay]);

    const createHandleItemClick = useCallback((idx: number) => {
        return () => handleItemClick(idx);
    }, [handleItemClick]);

    const createHandleRetry = useCallback((entry: PlayHistory) => {
        return () => handleRetry(entry);
    }, [handleRetry]);

    const createHandleReplay = useCallback((entry: PlayHistory) => {
        return () => handleReplay(entry);
    }, [handleReplay]);

    return (
        <ul className="space-y-1 overflow-y-auto rounded h-full">
            {playHistory === null && (
                <li className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="text-4xl mb-2">⏳</div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
                    </div>
                </li>
            )}
            {playHistory?.length === 0 && (
                <li className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                        <div className="text-6xl mb-4 opacity-20">🎮</div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">No games played yet</p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm">Start a new game to see your history here</p>
                    </div>
                </li>
            )}
            {playHistory?.map((entry, idx) => (
                <li
                    key={idx}
                    className="border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded transition-all"
                >
                    <div
                        onClick={createHandleItemClick(idx)}
                        className="grid grid-cols-[max-content_max-content_1fr] gap-2 text-sm items-center text-gray-900 dark:text-gray-100 p-2 cursor-pointer"
                    >
                        <span className="text-center max-w-[8ch]" title={entry.difficulty}>
                            {DifficultyText[entry.difficulty]}
                        </span>
                        <span
                            className={`font-semibold min-w-[4ch] ${entry.result === "Win"
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                                }`}
                            title={entry.result}
                        >
                            {entry.result}
                        </span>
                        <span className="text-right break-words">
                            {entry.time}s {entry.date && <span className="text-gray-500 dark:text-gray-400">({entry.date})</span>}
                        </span>
                    </div>
                    {expandedIndex === idx && (
                        <div className="p-2 pt-0">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">
                                Seed: {entry.seed || 'N/A'}
                            </div>
                            <div className="flex gap-2 justify-center">
                                <button
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                    title="Retry game"
                                    onClick={createHandleRetry(entry)}
                                >
                                    🔄
                                </button>
                                <button
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                    title="Replay your actions"
                                    onClick={createHandleReplay(entry)}
                                >
                                    ▶️
                                </button>
                                {/* <button
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                    title="AI play"
                                    disabled
                                >
                                    🤖
                                </button> */}
                            </div>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
});

export default PlayHistoryList;