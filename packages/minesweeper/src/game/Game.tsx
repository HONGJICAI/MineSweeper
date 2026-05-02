import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { CellType } from "./Cell";
import {
  easyMineSweeper,
  hardMineSweeper,
  mediumMineSweeper
} from "./utils/minesweeperLogic";
import { Difficulty, GameStatus, PlayHistory, Position, UserAction, UserActionDetail } from "./Game.types";
import StatisticsModal from "./StatisticsModal";
import { useUserActions } from "./hooks/useUserActions";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { usePlayHistory } from "./hooks/usePlayHistory";
import GameCoreArea from "./GameCoreArea";
import GameSidebar from "./GameSidebar";
import { useMineSweeperLogic } from "./hooks/useMineSweeperLogic";
import { useReplayController } from "./hooks/useReplayController";
import AutoGamingOverlay from "./AutoGamingOverlay";
import { useTimer } from "./hooks/useTimer";

export default function Game(props: {
  difficulty: Difficulty;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>(props.difficulty);
  const [mobileAction, setMobileAction] = useState<"reveal" | "flag">("reveal");

  const sweeper = useMemo(() => {
    if (difficulty === "easy") return easyMineSweeper();
    if (difficulty === "medium") return mediumMineSweeper();
    return hardMineSweeper();
  }, [difficulty]);

  const { mines, createEmptyBoard } = sweeper;
  const [board, setBoard] = useState<CellType[][]>(createEmptyBoard());
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Init);
  const { timerState, timerRef, startTimer, stopTimer, resetTimer } = useTimer();
  const [showStats, setShowStats] = useState(false);
  const { userActions, addUserAction, resetUserActions } = useUserActions();
  const { leaderboards, addLeaderboard, clearLeaderboard } = useLeaderboard();
  const { playHistoryMap, addPlayHistoryEntry, clearPlayHistory } = usePlayHistory();
  const [seed, setSeed] = useState<string>("");
  const [highlightedCell, setHighlightedCell] = useState<Position>();

  // Set by replay-start, read+cleared by onWinOrLose to skip persisting replay runs.
  const skipHistoryRef = useRef(false);

  const faceEmoji = useMemo(() => {
    switch (gameStatus) {
      case GameStatus.GameOver:
        return "😵";
      case GameStatus.Win:
        return "😎";
      default:
        return "😊";
    }
  }, [gameStatus]);

  const onBeginGame = useCallback((generatedSeed: string) => {
    setSeed(generatedSeed);
    setGameStatus(GameStatus.Gaming);
    startTimer();
  }, [startTimer]);

  const onWinOrLose = useCallback((status: GameStatus) => {
    setGameStatus(status);
    stopTimer();
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    if (userActions.length === 0) return;
    // Convert absolute timestamps to per-action durations for replay playback.
    const actionsWithDelta: UserActionDetail[] = userActions.map((action, i) => ({
      ...action,
      time: i + 1 < userActions.length ? userActions[i + 1].time - action.time : 0,
    }));
    const playHistory: PlayHistory = {
      result: status === GameStatus.Win ? "Win" : "Loss",
      time: timerRef.current,
      seed,
      actions: actionsWithDelta,
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    };
    if (status === GameStatus.Win) {
      addLeaderboard(difficulty, playHistory);
    }
    addPlayHistoryEntry(difficulty, playHistory);
  }, [addLeaderboard, addPlayHistoryEntry, difficulty, seed, userActions, timerRef, stopTimer]);

  const { flagCount, revealedMinePosition, handleCellClick, handleFlagCell, handleChordCell } = useMineSweeperLogic({
    board,
    setBoard,
    gameStatus,
    onBeginGame,
    onWinOrLose,
    sweeper,
  });

  const action2function = useMemo(() => ({
    reveal: handleCellClick,
    flag: handleFlagCell,
    chord: handleChordCell,
  }), [handleCellClick, handleFlagCell, handleChordCell]);

  const onCellAction = useCallback((action: UserAction) => {
    const func: ((r: number, c: number) => number) | undefined = action2function[action.type];
    if (!func) {
      console.warn(`No function found for action type: ${action.type}`);
      return;
    }
    const score = func(action.position.r, action.position.c);
    addUserAction({
      type: action.type,
      position: action.position,
      score,
      time: new Date().getTime(),
    });
  }, [addUserAction, action2function]);

  const handleReset = useCallback((clear = true) => {
    if (clear) setBoard(createEmptyBoard());
    setGameStatus(GameStatus.Init);
    resetTimer();
    setSeed("");
    resetUserActions();
  }, [createEmptyBoard, resetUserActions, resetTimer]);

  const onDifficultyChange = useCallback(() => {
    setBoard(createEmptyBoard());
    handleReset(false);
  }, [handleReset, createEmptyBoard]);

  useEffect(() => {
    onDifficultyChange();
  }, [difficulty, onDifficultyChange]);

  const onCloseStats = useCallback(() => {
    setShowStats(false);
  }, []);

  //#region Retry logic
  const [pendingRetry, setPendingRetry] = useState<{ seed: string, firstStep: Position }>();

  const onRetry = useCallback((seed: string, firstStep: Position) => {
    handleReset();
    setPendingRetry({ seed, firstStep });
  }, [handleReset]);

  useEffect(() => {
    if (pendingRetry && gameStatus === GameStatus.Init) {
      handleCellClick(pendingRetry.firstStep.r, pendingRetry.firstStep.c, pendingRetry.seed);
      addUserAction({
        type: "reveal",
        position: pendingRetry.firstStep,
        score: 1,
        time: new Date().getTime(),
      });
      setPendingRetry(undefined);
    }
  }, [pendingRetry, gameStatus, handleCellClick, addUserAction]);
  //#endregion

  const onReplayStart = useCallback(() => {
    skipHistoryRef.current = true;
  }, []);

  const replay = useReplayController({
    gameStatus,
    handleReset,
    handleCellClick,
    handleFlagCell,
    handleChordCell,
    addUserAction,
    setHighlightedCell,
    onReplayStart,
  });

  return (
    <div className="flex h-dvh w-dvw max-w-dvw max-h-dvh justify-center items-start lg:gap-8 gap-4 p-4 bg-white dark:bg-gray-900">
      <GameCoreArea
        title="MineSweeper"
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        mobileAction={mobileAction}
        setMobileAction={setMobileAction}
        timer={timerState}
        handleReset={handleReset}
        faceEmoji={faceEmoji}
        mines={mines - flagCount}
        setShowStats={setShowStats}
        board={board}
        gameStatus={gameStatus}
        highlightedCell={highlightedCell}
        onCellAction={onCellAction}
        seed={seed}
        lastStepOnMine={revealedMinePosition}
      />

      <GameSidebar
        leaderboards={leaderboards}
        difficulty={difficulty}
        userActions={userActions}
        setHighlightedCell={setHighlightedCell}
        playHistory={playHistoryMap?.[difficulty] ?? null}
        onRetry={onRetry}
        onReplay={replay.onClickReplayButton}
      />

      {showStats && playHistoryMap && (
        <StatisticsModal
          show={showStats}
          onClose={onCloseStats}
          playHistoryMap={playHistoryMap}
          onClearHistory={clearPlayHistory}
          onClearLeaderboard={clearLeaderboard}
        />
      )}
      {replay.showAutoPlayOverlay &&
        <AutoGamingOverlay
          isAutoPlaying={replay.autoPlaying}
          title={replay.replayTitle}
          onCancelAutoPlay={replay.onCancelReplay}
          onStartAutoPlay={replay.onStartReplay}
        />
      }
    </div>
  )
}
