import React from "react";
import { TitledDiv } from "./components/TitledDiv";

type PlayHistoryEntry = {
    result: "Win" | "Loss";
    time: number;
    date?: string;
    difficulty: string;
};

const HistoryList = React.memo(function HistoryList({ playHistory }: { playHistory: PlayHistoryEntry[] | null }) {
    return (
        <TitledDiv title="History" className="w-full min-w-[220px]">
            <ul className="space-y-1 max-h-[15ch] overflow-y-auto rounded">
                {playHistory === null && (
                    <li className="text-gray-500 dark:text-gray-400">Loading...</li>
                )}
                {playHistory?.length === 0 && <li className="text-gray-500 dark:text-gray-400">No games played yet.</li>}
                {playHistory?.map((entry, idx) => (
                    <li
                        key={idx}
                        className="grid grid-cols-[max-content_max-content_1fr] gap-2 text-sm items-center text-gray-900 dark:text-gray-100"
                    >
                        <span
                            className={`font-semibold min-w-[4ch] ${
                                entry.result === "Win" 
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
                    </li>
                ))}
            </ul>
        </TitledDiv>
    );
});

export default HistoryList;