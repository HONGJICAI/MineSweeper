import React, { useCallback } from "react";
import { ActionType, UserActionWithScore } from "./Game.types";

const actionEmoji: Record<ActionType, string> = {
    reveal: "⛏️",
    flag: "🚩",
    chord: "⚒️",
};

export default function ActionList({
    userActions,
    setHoveredCell,
}: {
    userActions: UserActionWithScore[];
    setHoveredCell: (cell: { r: number; c: number } | null) => void;
}) {
    const handleMouseEnter = useCallback(
        (position: { r: number; c: number }) => () => setHoveredCell(position),
        [setHoveredCell]
    );
    const handleMouseLeave = useCallback(
        () => setHoveredCell(null),
        [setHoveredCell]
    );

    return (
        <ul
            className="bg-gray-50 dark:bg-gray-800 rounded overflow-y-auto p-1"
            style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
            }}
        >
            <style>
                {`
            ul::-webkit-scrollbar {
              display: none;
            }
          `}
            </style>
            {userActions.length === 0 && (
                <li className="text-gray-500 dark:text-gray-400 p-2">No actions yet.</li>
            )}
            {userActions.map((action, idx) => {
                let colorClasses = "";
                if (action.score > 0) {
                    colorClasses = "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
                } else if (action.score < 0) {
                    colorClasses = "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
                } else {
                    colorClasses = "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
                }

                return (
                    <li
                        key={idx}
                        onMouseEnter={handleMouseEnter(action.position)}
                        onMouseLeave={handleMouseLeave}
                        className={`${colorClasses} rounded mb-1 px-2 py-1 cursor-pointer hover:scale-105 transition-transform flex items-center gap-2`}
                    >
                        <span className="text-gray-600 dark:text-gray-400 font-mono text-xs min-w-[4ch] text-right">
                            {userActions.length - idx}.
                        </span>
                        <span>{actionEmoji[action.type]}</span>{" "}
                        <b>{action.position.r}</b>, <b>{action.position.c}</b>
                    </li>
                );
            })}
        </ul>
    );
}