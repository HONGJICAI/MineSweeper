import React, { useCallback, useState } from "react";
import { TitledDiv } from "./components/TitledDiv";
import { Difficulty, DifficultyText, PlayHistory, Position, UserActionDetail } from "./Game.types";

interface LeaderboardProps {
    leaderboards: Record<Difficulty, PlayHistory[]> | null;
    difficulty: Difficulty;
    onRetry: (seed: string, firstStep: Position) => void;
    onReplay: (seed: string, actions: UserActionDetail[]) => void;
}

export default function Leaderboard({
    leaderboards,
    difficulty,
    onRetry,
    onReplay,
}: LeaderboardProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const handleItemClick = useCallback((index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    }, [expandedIndex]);

    const handleRetry = useCallback((entry: PlayHistory) => {
        const firstStep = entry.actions.at(0)?.position;
        if (!firstStep) {
            console.warn("No first step available for retry.");
            return;
        }
        onRetry?.(entry.seed, firstStep);
    }, [onRetry]);

    const handleReplay = useCallback((entry: PlayHistory) => {
        onReplay?.(entry.seed, entry.actions);
    }, [onReplay]);

    const createHandleItemClick = useCallback((idx: number) => {
        return () => handleItemClick(idx);
    }, [handleItemClick]);

    const createHandleRetry = useCallback((entry: PlayHistory) => {
        return (e: React.MouseEvent) => {
            e.stopPropagation();
            handleRetry(entry);
        };
    }, [handleRetry]);

    const createHandleReplay = useCallback((entry: PlayHistory) => {
        return (e: React.MouseEvent) => {
            e.stopPropagation();
            handleReplay(entry);
        };
    }, [handleReplay]);

    return (
        <TitledDiv title={`${DifficultyText[difficulty]} Leaderboard`} className="w-full min-w-[220px]">
            <ol className="rounded">
                {leaderboards === null && (
                    <li className="text-gray-500">Loading...</li>
                )}
                {leaderboards?.[difficulty]?.length === 0 && (
                    <li className="text-gray-500">No entries yet.</li>
                )}
                {leaderboards?.[difficulty]?.map((entry, idx) => (
                    <li
                        key={idx}
                        className="border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded transition-all"
                    >
                        <div
                            onClick={createHandleItemClick(idx)}
                            className="flex justify-between dark:text-gray-300 p-2 cursor-pointer dark:hover:bg-gray-800 rounded transition-colors"
                        >
                            <span className="font-medium">{entry.time}s</span>
                            <span className="text-xs text-gray-400 ml-2">{entry.date}</span>
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
                                        title="Replay"
                                        onClick={createHandleReplay(entry)}
                                    >
                                        ▶️
                                    </button>
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ol>
        </TitledDiv>
    );
}