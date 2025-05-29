import React from "react";
import GameControls from "./GameControls";
import Board from "./Board";
import { CellType } from "./Cell";
import { Difficulty, GameStatus, UserAction } from "./Game.types";

interface GameCoreAreaProps {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  mobileAction: "reveal" | "flag";
  setMobileAction: (a: "reveal" | "flag") => void;
  timer: number;
  handleReset: () => void;
  faceEmoji: string;
  mines: number;
  setShowStats: (show: boolean) => void;
  board: CellType[][];
  gameStatus: GameStatus;
  hoveredCell: { r: number; c: number } | null;
  rows: number;
  cols: number;
  onCellAction: (action: UserAction) => number;
}

const GameCoreArea = React.memo(function GameCoreArea({
  difficulty,
  setDifficulty,
  mobileAction,
  setMobileAction,
  timer,
  handleReset,
  faceEmoji,
  mines,
  setShowStats,
  board,
  gameStatus,
  hoveredCell,
  rows,
  cols,
  onCellAction,
}: GameCoreAreaProps) {
  // Calculate minimum dimensions based on board size
  // Cell size is 8 (assuming w-8 h-8 which is 32px)
  // Add padding for controls and margins
  const minWidthClass =
    difficulty === "easy"
      ? "min-w-[320px]"
      : difficulty === "medium"
      ? "min-w-[512px]"
      : "min-w-[896px]";

  return (
    <div
      className={`flex flex-col items-center flex-1 ${minWidthClass} min-h-[480px]`}
    >
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
        Minesweeper
      </h1>
      <GameControls
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        mobileAction={mobileAction}
        setMobileAction={setMobileAction}
        timer={timer}
        handleReset={handleReset}
        faceEmoji={faceEmoji}
        mines={mines}
        setShowStats={setShowStats}
      />
      <Board
        board={board}
        gameStatus={gameStatus}
        hoveredCell={hoveredCell}
        rows={rows}
        cols={cols}
        onCellAction={onCellAction}
      />
    </div>
  );
});

export default GameCoreArea;