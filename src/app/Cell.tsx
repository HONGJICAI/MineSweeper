import React from "react";

export type CellType = {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    adjacentMines: number;
};

interface CellProps {
    cell: CellType;
    r: number;
    c: number;
    isPressed?: boolean;
    onContextMenu?: (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => void;
    onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => void;
    onMouseUp?: (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => void;
    onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => void;
    onTouchStart?: (e: React.TouchEvent<HTMLButtonElement>, r: number, c: number) => void;
    onTouchEnd?: (e: React.TouchEvent<HTMLButtonElement>, r: number, c: number) => void;
    onTouchMove?: (e: React.TouchEvent<HTMLButtonElement>) => void;
    onTouchCancel?: (e: React.TouchEvent<HTMLButtonElement>) => void;
}

export default function Cell({
    cell,
    r,
    c,
    isPressed = false,
    onContextMenu,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onTouchCancel,
}: CellProps) {
    return (
        <button
            key={`${r}-${c}`}
            onContextMenu={(e) => onContextMenu?.(e, r, c)}
            onMouseDown={(e) => onMouseDown?.(e, r, c)}
            onMouseUp={(e) => onMouseUp?.(e, r, c)}
            onMouseLeave={(e) => onMouseLeave?.(e, r, c)}
            onTouchStart={(e) => onTouchStart?.(e, r, c)}
            onTouchEnd={(e) => onTouchEnd?.(e, r, c)}
            onTouchMove={onTouchMove}
            onTouchCancel={onTouchCancel}
            className={`w-8 h-8 flex items-center justify-center border border-gray-400 dark:border-gray-600 text-lg font-mono select-none
        ${cell.isRevealed
                ? "bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
                : isPressed
                    ? "bg-gray-200 dark:bg-gray-700"
                    : "bg-gray-400 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
            }
        ${cell.isFlagged ? "bg-yellow-300 dark:bg-yellow-700" : ""}
        ${cell.isRevealed && cell.isMine ? "bg-red-400 dark:bg-red-700" : ""}
      `}
            aria-label={
                cell.isFlagged
                    ? "Flag"
                    : cell.isRevealed && cell.isMine
                        ? "Mine"
                        : cell.isRevealed
                            ? cell.adjacentMines
                                ? `${cell.adjacentMines} adjacent mines`
                                : "Empty"
                            : "Hidden"
            }
        >
            {cell.isRevealed
                ? cell.isMine
                    ? "💣"
                    : cell.adjacentMines > 0
                        ? cell.adjacentMines
                        : ""
                : cell.isFlagged
                    ? "🚩"
                    : ""}
        </button>
    );
}