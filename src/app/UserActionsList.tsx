import React from "react";
import { ActionType, UserAction } from "./Game.types";
import { TitledDiv } from "./components/TitledDiv";

const actionEmoji: Record<ActionType, string> = {
    reveal: "⛏️",
    flag: "🚩",
    chord: "⚒️",
};

export default function UserActionsList({
    userActions,
    setHoveredCell,
}: {
    userActions: UserAction[];
    setHoveredCell: (cell: { r: number; c: number } | null) => void;
}) {
    return (
        <TitledDiv title="Actions">
            <ul
                className="bg-gray-50 dark:bg-gray-700 rounded overflow-y-auto max-h-40"
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
                    <li className="text-gray-400">No actions yet.</li>
                )}
                {userActions.map((action, idx) => {
                    let bgColor = "";
                    if (action.score > 0) bgColor = "bg-green-100";
                    else if (action.score < 0) bgColor = "bg-red-100";
                    else bgColor = "bg-yellow-100";
                    return (
                        <li
                            key={idx}
                            onMouseEnter={() => setHoveredCell(action.position)}
                            onMouseLeave={() => setHoveredCell(null)}
                            style={{ cursor: "pointer" }}
                            className={`${bgColor} rounded mb-1 px-1 hover:scale-105 transition-transform`}
                        >
                            <span>{actionEmoji[action.type]}</span>{" "}
                            Row: <b>{action.position.r}</b>, Col: <b>{action.position.c}</b>
                        </li>
                    );
                })}
            </ul>
        </TitledDiv>
    );
}