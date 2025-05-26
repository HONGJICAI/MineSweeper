import React from "react";

type ActionType = "reveal" | "flag" | "chord";
type UserAction = {
  type: ActionType;
  position: { r: number; c: number };
  score: number;
};

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
    <div className="mt-4">
      <h3 className="text-md font-semibold mb-1 text-gray-900 dark:text-gray-100">User Actions</h3>
      <ul
        className="bg-gray-50 dark:bg-gray-700 rounded p-2"
        style={{
          maxHeight: "10rem",
          overflowY: "auto",
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
              className={`${bgColor} rounded mb-1 px-1`}
            >
              <span>{actionEmoji[action.type]}</span>{" "}
              Row: <b>{action.position.r}</b>, Col: <b>{action.position.c}</b>
            </li>
          );
        })}
      </ul>
    </div>
  );
}