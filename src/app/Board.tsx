import React, { useCallback, useMemo } from "react";
import Cell from "./Cell";
import { CellType } from "./Cell";
import { GameStatus, UserAction } from "./Game.types";
import { useDesktopMouse } from "./useDesktopMouse";

type BoardProps = {
    board: CellType[][];
    gameStatus: GameStatus;
    hoveredCell: { r: number; c: number } | null;
    rows: number;
    cols: number;
    onCellAction: (action: UserAction) => void;
};
const Board = React.memo(function Board({
    board,
    gameStatus,
    hoveredCell,
    rows,
    cols,
    onCellAction,
}: BoardProps) {
    const {
        mouseAction,
        resetMouseAction,
        handleMouseDown,
        handleMouseUp,
    } = useDesktopMouse({
        gameStatus,
        onCellAction
    });
    const onLeaveBoard = useCallback(() => {
        if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
        if (mouseAction.leftDown || mouseAction.rightDown)
            resetMouseAction();
    }, [gameStatus, resetMouseAction, mouseAction]);
    const onMouseUpOnBoard = useCallback(() => {
        if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
        resetMouseAction();
    }, [gameStatus, resetMouseAction]);
    const cells = useMemo(() => {
        return board.map((row, r) => {
            return row.map((cell, c) => {
                const canPress =
                    !cell.isRevealed &&
                    !cell.isFlagged &&
                    gameStatus !== GameStatus.GameOver &&
                    gameStatus !== GameStatus.Win;
                const isPressed =
                    canPress &&
                    mouseAction.leftDown &&
                    mouseAction.position.r === r &&
                    mouseAction.position.c === c;
                const isNeighborPressed =
                    canPress &&
                    mouseAction.leftDown &&
                    Math.abs(mouseAction.position.r - r) <= 1 &&
                    Math.abs(mouseAction.position.c - c) <= 1 &&
                    mouseAction.rightDown;
                const showAsPressed = isPressed || isNeighborPressed;
                const isHighlighted = hoveredCell && hoveredCell.r === r && hoveredCell.c === c;

                return (
                    <Cell
                        key={`${r}-${c}`}
                        cell={cell}
                        r={r}
                        c={c}
                        isPressed={showAsPressed ?? false}
                        isHighlighted={!!isHighlighted}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                    // onTouchStart={(e) => handleTouchStart?.(e, r, c)}
                    // onTouchEnd={(e) => handleTouchEnd?.(e, r, c)}
                    />
                );
            });
        });
    }, [board, gameStatus, mouseAction, hoveredCell, handleMouseDown, handleMouseUp]);

    return (
        <div
            className="grid"
            style={{
                gridTemplateRows: `repeat(${rows}, 2rem)`,
                gridTemplateColumns: `repeat(${cols}, 2rem)`,
                gap: "2px",
            }}
            onMouseLeave={onLeaveBoard}
            onMouseUp={onMouseUpOnBoard}
        >
            {cells}
        </div>
    );
});

export default Board;