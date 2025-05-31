import React, { useCallback } from "react";
import { GameStatus } from "./Game.types";

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
    lastStepOnMine?: boolean;
    gameStatus: GameStatus;
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
    isHighlighted = false,
    lastStepOnMine = false,
    gameStatus,
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
    const getText = useCallback(() => {
        if (cell.isRevealed) {
            if (cell.isMine) return cell.isFlagged ? "🚩" : "💣";
            if (cell.adjacentMines > 0) return cell.adjacentMines.toString();
            return "";
        } else if (cell.isFlagged) {
            if (GameStatus.GameOver === gameStatus && !cell.isMine) return "❌";
            return "🚩";
        }
        return "";
    }, [cell, gameStatus]);


    return (
        <button
            key={`${r}-${c}`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`size-8 flex items-center justify-center border border-gray-400 dark:border-gray-600 text-lg font-mono select-none text-gray-900 dark:text-gray-100
        ${cell.isRevealed
                    ? "bg-gray-100 dark:bg-gray-800 dark:text-gray-200"
                    : isPressed
                        ? "bg-gray-200 dark:bg-gray-700"
                        : "bg-gray-400 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                }
            ${isHighlighted ? "ring-2 ring-blue-500 dark:ring-blue-300" : ""}
        ${lastStepOnMine ? "bg-red-400 dark:bg-red-700" : ""}
      `}
        >
            {getText()}
        </button>
    );
});

export default Cell;