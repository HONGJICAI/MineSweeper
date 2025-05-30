import React, { useState } from "react";
import { PlayHistory } from "./usePlayHistory";

const HistoryList = React.memo(function HistoryList({ playHistory }: { playHistory: PlayHistory[] | null }) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(playHistory?.length ?? 0 > 0 ? 0 : null);

    const handleItemClick = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <ul className="space-y-1 overflow-y-auto rounded">
            {playHistory === null && (
                <li className="text-gray-500 dark:text-gray-400">Loading...</li>
            )}
            {playHistory?.length === 0 && <li className="text-gray-500 dark:text-gray-400">No games played yet.</li>}
            {playHistory?.map((entry, idx) => (
                <li
                    key={idx}
                    className="border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded transition-all"
                >
                    <div
                        onClick={() => handleItemClick(idx)}
                        className="grid grid-cols-[max-content_max-content_1fr] gap-2 text-sm items-center text-gray-900 dark:text-gray-100 p-2 cursor-pointer"
                    >
                        <span
                            className={`font-semibold min-w-[4ch] ${entry.result === "Win"
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                            title={entry.result}
                        >
                            {entry.result}
                        </span>
                        <span className="text-center max-w-[8ch]" title={entry.difficulty}>
                            ({entry.difficulty})
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
                                    title="Replay game"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Replay game', idx);
                                    }}
                                >
                                    🔄
                                </button>
                                <button
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                    title="Replay your actions"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Watch video', idx);
                                    }}
                                >
                                    ▶️
                                </button>
                                <button
                                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                                    title="AI play"
                                    disabled
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('AI play', idx);
                                    }}
                                >
                                    🤖
                                </button>
                            </div>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
});

export default HistoryList;