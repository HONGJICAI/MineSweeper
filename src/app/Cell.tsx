import React, { useCallback } from "react";

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
    isHighlighted?: boolean;
    onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => void;
    onMouseUp?: (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => void;
    onTouchStart?: (e: React.TouchEvent<HTMLButtonElement>, r: number, c: number) => void;
    onTouchEnd?: (e: React.TouchEvent<HTMLButtonElement>, r: number, c: number) => void;
}

const Cell = React.memo(function Cell({
    cell,
    r,
    c,
    isPressed = false,
    isHighlighted,
    onMouseDown,
    onMouseUp,
    onTouchStart,
    onTouchEnd,
}: CellProps) {
    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => onMouseDown?.(e, r, c),
        [onMouseDown, r, c]
    );
    const handleMouseUp = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => onMouseUp?.(e, r, c),
        [onMouseUp, r, c]
    );
    const handleTouchStart = useCallback(
        (e: React.TouchEvent<HTMLButtonElement>) => onTouchStart?.(e, r, c),
        [onTouchStart, r, c]
    );
    const handleTouchEnd = useCallback(
        (e: React.TouchEvent<HTMLButtonElement>) => onTouchEnd?.(e, r, c),
        [onTouchEnd, r, c]
    );

    return (
        <button
            key={`${r}-${c}`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
                backgroundColor: isHighlighted ? "#ffe066" : undefined,
            }}
            className={`w-8 h-8 flex items-center justify-center border border-gray-400 dark:border-gray-600 text-lg font-mono select-none
        ${cell.isRevealed
                ? "bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
                : isPressed
                    ? "bg-gray-200 dark:bg-gray-700"
                    : "bg-gray-400 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
            }
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
});

export default Cell;