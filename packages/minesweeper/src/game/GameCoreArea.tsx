import React from "react";
import GameControls from "./GameControls";
import Board from "./Board";
import { CellType } from "./Cell";
import { Difficulty, GameStatus, Position, UserAction } from "./Game.types";

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
    highlightedCell?: Position;
    onCellAction: (action: UserAction) => void;
    seed: string;
    lastStepOnMine?: Position;
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
    onCellAction,
    seed,
    lastStepOnMine
}: GameCoreAreaProps) {
    // Min width only applied above the difficulty's "full" breakpoint —
    // below it, the column shrinks to viewport and the board scrolls inside its wrapper.
    const minWidthClass =
        difficulty === "easy"
            ? "easyFull:min-w-[320px]"
            : difficulty === "medium"
                ? "mediumFull:min-w-[512px]"
                : "hardFull:min-w-[896px]";

    //   const handleCopySeed = () => {
    //     if (seed) {
    //       navigator.clipboard.writeText(seed);
    //     }
    //   };

    return (
        <div
            className={`flex flex-col items-center flex-1 min-w-0 ${minWidthClass} min-h-[480px] h-full`}
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
            <div className="flex-1 min-h-0 max-w-full w-fit overflow-auto">
                <Board
                    board={board}
                    gameStatus={gameStatus}
                    highlightedCell={highlightedCell}
                    lastStepOnMine={lastStepOnMine}
                    onCellAction={onCellAction}
                    mobileAction={mobileAction}
                />
            </div>
        </div>
    );
});

export default GameCoreArea;