import React from "react";
import { Button } from "./components/Button";

type Difficulty = "easy" | "medium" | "hard";

interface GameControlsProps {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  mobileAction: "reveal" | "flag";
  setMobileAction: (a: "reveal" | "flag") => void;
  timer: number;
  handleReset: () => void;
  faceEmoji: string;
  mines: number;
  setShowStats: (show: boolean) => void;
}

export default function GameControls({
  difficulty,
  setDifficulty,
//   mobileAction,
//   setMobileAction,
  timer,
  handleReset,
  faceEmoji,
  mines,
  setShowStats,
}: GameControlsProps) {
  return (
    <>
      {/* Difficulty selection */}
      <div className="flex gap-2 mb-2">
        <Button onClick={() => setDifficulty("easy")} active={difficulty === "easy"}>
          Easy
        </Button>
        <Button onClick={() => setDifficulty("medium")} active={difficulty === "medium"}>
          Medium
        </Button>
        <Button onClick={() => setDifficulty("hard")} active={difficulty === "hard"}>
          Hard
        </Button>
        <Button onClick={() => setShowStats(true)}>
          📊
        </Button>
      </div>
      {/* Mobile action toggle */}
      {/* <div className="mb-2 flex gap-2 justify-center">
        <Button onClick={() => setMobileAction("reveal")} active={mobileAction === "reveal"}>
          ⛏️
        </Button>
        <Button onClick={() => setMobileAction("flag")} active={mobileAction === "flag"}>
          🚩
        </Button>
      </div> */}
      <div className="flex gap-16 items-center mb-2">
        <span className="text-gray-800 dark:text-gray-200 font-semibold">
          ⏰ {timer}s
        </span>
        <Button onClick={handleReset} className="px-2 py-2">
          {faceEmoji}
        </Button>
        <span className="text-gray-800 dark:text-gray-200 font-semibold">
          💣 {mines}
        </span>
      </div>
    </>
  );
}