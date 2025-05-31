import React from "react";
import GameControls from "./GameControls";
import Board from "./Board";
import { CellType } from "./Cell";
import { Difficulty, GameStatus, UserAction } from "./Game.types";

interface GameCoreAreaProps {
    title: string;
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
    highlightedCell: { r: number; c: number } | null;
    rows: number;
    cols: number;
    onCellAction: (action: UserAction) => void;
    seed: string;
}

const GameCoreArea = React.memo(function GameCoreArea({
    title,
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
    highlightedCell,
    rows,
    cols,
    onCellAction,
    seed,
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

    //   const handleCopySeed = () => {
    //     if (seed) {
    //       navigator.clipboard.writeText(seed);
    //     }
    //   };

    return (
        <div
            className={`flex flex-col items-center flex-1 ${minWidthClass} min-h-[480px]`}
        >
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                {title}
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
            {
                <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Seed:</span>
                    <code className="text-xs font-mono text-gray-800 dark:text-gray-200">{seed}</code>
                    {/* <button
            onClick={handleCopySeed}
            className="text-xs px-2 py-0.5 text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Copy seed"
          >
            Copy
          </button> */}
                </div>
            }
            <Board
                board={board}
                gameStatus={gameStatus}
                highlightedCell={highlightedCell}
                rows={rows}
                cols={cols}
                onCellAction={onCellAction}
            />
        </div>
    );
});

export default GameCoreArea;