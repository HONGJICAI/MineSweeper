import React, { useCallback } from "react";
import { ActionType, UserActionDetail } from "./Game.types";

const actionEmoji: Record<ActionType, string> = {
    reveal: "⛏️",
    flag: "🚩",
    chord: "⚒️",
};

export default function ActionList({
    userActions,
    setHoveredCell,
}: {
    userActions: UserActionDetail[];
    setHoveredCell: (cell?: { r: number; c: number }) => void;
}) {
    const handleMouseEnter = useCallback(
        (position: { r: number; c: number }) => () => setHoveredCell(position),
        [setHoveredCell]
    );
    const handleMouseLeave = useCallback(
        () => setHoveredCell(undefined),
        [setHoveredCell]
    );

    return (
        <ul
            className="bg-gray-50 dark:bg-gray-800 rounded overflow-y-auto p-1 h-full"
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
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .action-item {
              animation: slideDown 0.3s ease-out;
            }
          `}
            </style>
            {userActions.length === 0 && (
                <li className="flex items-center justify-center h-full">
                    <div className="text-center p-8">
                        <div className="text-6xl mb-4 opacity-20">🎯</div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                            No actions yet
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-sm">
                            Your moves will appear here
                        </p>
                    </div>
                </li>
            )}
            {userActions.reduceRight<React.ReactNode[]>(
                (acc, action, idx) => {
                    let colorClasses = "";
                    if (action.score > 0) {
                        colorClasses =
                            "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
                    } else if (action.score < 0) {
                        colorClasses =
                            "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300";
                    } else {
                        colorClasses =
                            "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300";
                    }

                    acc.push(
                        <li
                            key={`${action.position.r}-${action.position.c}-${idx}`}
                            onMouseEnter={handleMouseEnter(action.position)}
                            onMouseLeave={handleMouseLeave}
                            className={`action-item ${colorClasses} rounded mb-1 px-2 py-1 cursor-pointer hover:scale-105 transition-transform flex items-center gap-2`}
                        >
                            <span className="text-gray-600 dark:text-gray-400 font-mono text-xs min-w-[4ch] text-right">
                                {idx + 1}.
                            </span>
                            <span>{actionEmoji[action.type]}</span>{" "}
                            <b>{action.position.r}</b>, <b>{action.position.c}</b>
                        </li>
                    );
                    return acc;
                },
                []
            )}
        </ul>
    );
}