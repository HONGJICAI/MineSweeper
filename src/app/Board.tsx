import React from "react";
import Cell from "./Cell";
import { CellType } from "./Cell";
import { GameStatus } from "./Game.types";

type BoardProps = {
  board: CellType[][];
  mouseCell: { r: number; c: number } | null;
  mouseDownRef: React.MutableRefObject<{ left: boolean; right: boolean }>;

  gameStatus: GameStatus;
  hoveredCell: { r: number; c: number } | null;
  rows: number;
  cols: number;
  handleMouseDown: (
    e: React.MouseEvent<HTMLButtonElement>,
    r: number,
    c: number
  ) => void;
  handleMouseUp: (
    e: React.MouseEvent<HTMLButtonElement>,
    r: number,
    c: number
  ) => void;
  handleMouseLeave: () => void;
  handleTouchStart: (
    e: React.TouchEvent<HTMLButtonElement>,
    r: number,
    c: number
  ) => void;
  handleTouchEnd: (
    e: React.TouchEvent<HTMLButtonElement>,
    r: number,
    c: number
  ) => void;
};

export default function Board({
  board,
  mouseCell,
  mouseDownRef,
  gameStatus,
  hoveredCell,
  rows,
  cols,
  handleMouseDown,
  handleMouseUp,
  handleMouseLeave,
  handleTouchStart,
  handleTouchEnd,
}: BoardProps) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateRows: `repeat(${rows}, 2rem)`,
        gridTemplateColumns: `repeat(${cols}, 2rem)`,
        gap: "2px",
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const canPress =
            !cell.isRevealed &&
            !cell.isFlagged &&
            gameStatus !== GameStatus.GameOver &&
            gameStatus !== GameStatus.Win;
          const isPressed =
            canPress &&
            mouseDownRef.current.left &&
            mouseCell &&
            mouseCell.r === r &&
            mouseCell.c === c;
          const isNeighborPressed =
            canPress &&
            mouseDownRef.current.left &&
            mouseDownRef.current.right &&
            mouseCell &&
            Math.abs(mouseCell.r - r) <= 1 &&
            Math.abs(mouseCell.c - c) <= 1 &&
            !(mouseCell.r === r && mouseCell.c === c);
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
              onMouseLeave={handleMouseLeave}
              onTouchStart={(e) => handleTouchStart(e, r, c)}
              onTouchEnd={(e) => handleTouchEnd(e, r, c)}
            />
          );
        })
      )}
    </div>
  );
}