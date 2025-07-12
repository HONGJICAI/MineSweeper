import React, { useCallback, useMemo } from "react";
import Cell from "./Cell";
import { CellType } from "./Cell";
import { GameStatus, Position, UserAction } from "./Game.types";
import { useDesktopMouse } from "./hooks/useDesktopMouse";

type BoardProps = {
    board: CellType[][];
    gameStatus: GameStatus;
    highlightedCell?: Position;
    lastStepOnMine?: Position;
    rows: number;
    cols: number;
    onCellAction: (action: UserAction) => void;
};
const Board = React.memo(function Board({
    board,
    gameStatus,
    highlightedCell,
    rows,
    cols,
    lastStepOnMine,
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
                const isHighlighted = highlightedCell && highlightedCell.r === r && highlightedCell.c === c;

                return (
                    <Cell
                        key={`${r}-${c}`}
                        cell={cell}
                        r={r}
                        c={c}
                        gameStatus={gameStatus}
                        isPressed={showAsPressed ?? false}
                        isHighlighted={!!isHighlighted}
                        lastStepOnMine={lastStepOnMine?.r === r && lastStepOnMine?.c === c}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                    // onTouchStart={(e) => handleTouchStart?.(e, r, c)}
                    // onTouchEnd={(e) => handleTouchEnd?.(e, r, c)}
                    />
                );
            });
        });
    }, [board, gameStatus, mouseAction, highlightedCell, handleMouseDown, handleMouseUp, lastStepOnMine]);

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