import React from "react";

export type CellType = {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    adjacentMines: number;
};

type CellProps = {
    cell: CellType;
    r: number;
    c: number;
    isPressed?: boolean;
    onClick?: (r: number, c: number) => void;
    onContextMenu?: (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => void;
    onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => void;
    onMouseUp?: (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => void;
    onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => void;
};

export default function Cell({
    cell,
    r,
    c,
    isPressed = false,
    onClick,
    onContextMenu,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
}: CellProps) {
    return (
        <button
            key={`${r}-${c}`}
            onClick={() => onClick?.(r, c)}
            onContextMenu={(e) => onContextMenu?.(e, r, c)}
            onMouseDown={(e) => onMouseDown?.(e, r, c)}
            onMouseUp={(e) => onMouseUp?.(e, r, c)}
            onMouseLeave={(e) => onMouseLeave?.(e, r, c)}
            className={`w-8 h-8 flex items-center justify-center border border-gray-400 text-lg font-mono select-none
        ${cell.isRevealed
                    ? "bg-gray-100"
                    : isPressed
                        ? "bg-gray-200"
                        : "bg-gray-400 hover:bg-gray-300"
                }
        ${cell.isFlagged ? "bg-yellow-300" : ""}
        ${cell.isRevealed && cell.isMine ? "bg-red-400" : ""}
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