import { useCallback, useMemo } from "react";
import { Button } from "./components/Button";
import { Difficulty } from "./Game.types";
import { setWindowSize } from "./utils/platform";

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
  mobileAction,
  setMobileAction,
  timer,
  handleReset,
  faceEmoji,
  mines,
  setShowStats,
}: GameControlsProps) {
  const handleEasy = useCallback(async () => {
    await setWindowSize(420, 480 + 32);
    setDifficulty("easy");
  }, [setDifficulty]);

  const handleMedium = useCallback(async () => {
    await setWindowSize(660, 750);
    setDifficulty("medium");
  }, [setDifficulty]);

  const handleHard = useCallback(async() => {
    await setWindowSize(1140, 750);
    setDifficulty("hard");
  }, [setDifficulty]);

  const handleShowStats = useCallback(() => setShowStats(true), [setShowStats]);
  const handlePickReveal = useCallback(() => setMobileAction("reveal"), [setMobileAction]);
  const handlePickFlag = useCallback(() => setMobileAction("flag"), [setMobileAction]);

  const mobileToggleHiddenClass = useMemo(() => {
    switch (difficulty) {
      case "easy": return "easyFull:hidden";
      case "medium": return "mediumFull:hidden";
      case "hard": return "hardFull:hidden";
    }
  }, [difficulty]);

  return (
    <>
      {/* Difficulty selection */}
      <div className="flex gap-2 mb-2">
        <Button onClick={handleEasy} active={difficulty === "easy"}>
          🥉
        </Button>
        <Button onClick={handleMedium} active={difficulty === "medium"}>
          🥈
        </Button>
        <Button onClick={handleHard} active={difficulty === "hard"}>
          🥇
        </Button>
        <Button onClick={handleShowStats}>
          📊
        </Button>
      </div>
      {/* Mobile action toggle - only on small screens */}
      <div className={`${mobileToggleHiddenClass} mb-2 flex gap-2 justify-center`}>
        <Button onClick={handlePickReveal} active={mobileAction === "reveal"}>
          ⛏️
        </Button>
        <Button onClick={handlePickFlag} active={mobileAction === "flag"}>
          🚩
        </Button>
      </div>
      <div className="flex gap-4 items-center mb-2">
        <div className="flex items-center gap-2 min-w-[80px]">
          <span className="text-gray-800 dark:text-gray-200 font-semibold">
            ⏰
          </span>
          <span className="text-gray-800 dark:text-gray-200 font-semibold font-mono w-12 text-right">
            {timer}s
          </span>
        </div>
        <Button onClick={handleReset} className="px-2 py-2">
          {faceEmoji}
        </Button>
        <div className="flex items-center gap-2 min-w-[80px]">
          <span className="text-gray-800 dark:text-gray-200 font-semibold">
            💣
          </span>
          <span className="text-gray-800 dark:text-gray-200 font-semibold font-mono w-12">
            {mines}
          </span>
        </div>
      </div>
    </>
  );
}