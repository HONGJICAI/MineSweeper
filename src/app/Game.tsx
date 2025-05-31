"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { CellType } from "./Cell";
import {
  easyMineSweeper,
  hardMineSweeper,
  mediumMineSweeper
} from "./utils/minesweeperLogic";
import { Difficulty, GameStatus, PlayHistory, Position, UserAction, UserActionDetail } from "./Game.types";
import React from "react";
import StatisticsModal from "./StatisticsModal";
import { useUserActions } from "./hooks/useUserActions";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { usePlayHistory } from "./hooks/usePlayHistory";
import GameCoreArea from "./GameCoreArea";
import GameSidebar from "./GameSidebar";
import { useMineSweeperLogic } from "./hooks/useMineSweeperLogic";
import AutoGamingOverlay from "./AutoGamingOverlay";
import { useTimer } from "./hooks/useTimer";
import { ReplayConfig } from "./global";

export default function Game(props: {
  difficulty: Difficulty;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>(props.difficulty);
  const [mobileAction, setMobileAction] = useState<"reveal" | "flag">("reveal");

  // Select the correct logic based on difficulty
  const sweeper = useMemo(() => {
    if (difficulty === "easy") return easyMineSweeper();
    if (difficulty === "medium") return mediumMineSweeper();
    return hardMineSweeper();
  }, [difficulty]);

  const { mines, rows, cols, createEmptyBoard, resetBoardInPlace } = sweeper;
  const [board, setBoard] = useState<CellType[][]>(createEmptyBoard());
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Init);
  const { timerState, timerRef, startTimer, stopTimer, resetTimer } = useTimer();
  const [showStats, setShowStats] = useState(false);
  const { userActions, addUserAction, resetUserActions } = useUserActions();
  const { leaderboards, addLeaderboard, clearLeaderboard } = useLeaderboard();
  const { playHistory, addPlayHistoryEntry, clearPlayHistory } = usePlayHistory();
  const [seed, setSeed] = useState<string>("");
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

  const onBeginGame = useCallback((board: CellType[][], r: number, c: number, seed: string, replay: boolean) => {
    const generatedSeed = sweeper.generateBoardInPlace(board, r, c, seed, replay);
    setSeed(generatedSeed);
    setGameStatus(GameStatus.Gaming);
    startTimer();
  }, [sweeper, startTimer]);

  const onWinOrLose = useCallback((status: GameStatus) => {
    setGameStatus(status);
    if (skipHistory.current) {
      skipHistory.current = false;
    } else {
      for (let i = 0; i + 1 < userActions.length; i++) {
        userActions[i].time = userActions[i + 1].time - userActions[i].time;
      }
      userActions[userActions.length - 1].time = 0;
      const playHistory: PlayHistory = {
        result: status === GameStatus.Win ? "Win" : "Loss",
        time: timerRef.current,
        difficulty,
        seed,
        actions: userActions,
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }),
      };
      if (status === GameStatus.Win) {
        addLeaderboard(difficulty, playHistory);
      }
      addPlayHistoryEntry(playHistory);
    }
    stopTimer();
  }, [addLeaderboard, addPlayHistoryEntry, difficulty, seed, userActions, timerRef, stopTimer]);

  const { flagCount, revealedMinePosition, handleCellClick, handleFlagCell, handleChordCell } = useMineSweeperLogic({
    board,
    setBoard,
    gameStatus,
    onBeginGame,
    onWinOrLose,
    sweeper,
  });

  const action2function = useMemo(() => {
    return {
      reveal: handleCellClick,
      flag: handleFlagCell,
      chord: handleChordCell,
    };
  }, [handleCellClick, handleFlagCell, handleChordCell]);

  const onCellAction = useCallback(
    (action: UserAction) => {
      const func: ((r: number, c: number) => number) | undefined = action2function[action.type] ? action2function[action.type] : undefined;
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
    if (clear) {
      setBoard((prevBoard) => {
        resetBoardInPlace(prevBoard);
        return [...prevBoard];
      });
    }
    setGameStatus(GameStatus.Init);
    resetTimer();
    setSeed("");
    resetUserActions();
  }, [resetBoardInPlace, resetUserActions, resetTimer]);

  const onDifficultyChange = useCallback(() => {
    setBoard(createEmptyBoard())
    handleReset(false);
  }, [handleReset, createEmptyBoard]);

  useEffect(() => {
    onDifficultyChange();
  }, [difficulty, onDifficultyChange]);

  const [highlightedCell, setHighlightedCell] = useState<Position>();

  const onCloseStats = useCallback(() => {
    setShowStats(false);
  }, []);

  //#region Retry logic
  const [pendingRetry, setPendingRetry] = useState<{ seed: string, firstStep: Position }>();

  const onRetry = useCallback((seed: string, replayDifficulty: Difficulty, firstStep: Position) => {
    if (replayDifficulty !== difficulty) {
      setDifficulty(replayDifficulty);
    } else {
      onDifficultyChange();
    }
    setPendingRetry({ seed, firstStep });
  }, [difficulty, onDifficultyChange]);

  useEffect(() => {
    if (pendingRetry && gameStatus === GameStatus.Init && board.length === rows && board[0]?.length === cols) {
      handleCellClick(pendingRetry.firstStep.r, pendingRetry.firstStep.c, pendingRetry.seed);
      addUserAction({
        type: "reveal",
        position: pendingRetry.firstStep,
        score: 1,
        time: new Date().getTime(),
      });
      setPendingRetry(undefined);
    }
  }, [pendingRetry, gameStatus, board, rows, cols, handleCellClick, addUserAction]);
  //#endregion

  //#region Replay logic
  const [pendingReplay, setPendingReplay] = useState<{ seed: string; actions: UserActionDetail[], current: number } | null>(null);
  const skipHistory = useRef<boolean>(false);
  const lastPlayedStep = useRef<number | null>(null);
  const [autoPlaying, setAutoPlaying] = useState<boolean>(false);
  const [showAutoPlayOverlay, setShowAutoPlayOverlay] = useState<boolean>(false);
  const replayTitle = useMemo(() => {
    if (!pendingReplay) return undefined;
    return `Replaying actions ${pendingReplay.current + 1}/${pendingReplay.actions.length}`;
  }, [pendingReplay]);

  useEffect(() => {
    if (autoPlaying && pendingReplay && (gameStatus === GameStatus.Init || gameStatus === GameStatus.Gaming) && board.length === rows && board[0]?.length === cols) {
      if (pendingReplay.current < pendingReplay.actions.length && lastPlayedStep.current !== pendingReplay.current) {
        const action = pendingReplay.actions[pendingReplay.current];
        const step = action.position;
        if (action.type === "reveal") {
          handleCellClick(step.r, step.c, pendingReplay.seed, true);
        } else if (action.type === "flag") {
          handleFlagCell(step.r, step.c);
        } else if (action.type === "chord") {
          handleChordCell(step.r, step.c);
        }
        setHighlightedCell(step);
        addUserAction(action);
        lastPlayedStep.current = pendingReplay.current;
        setTimeout(() => {
          setPendingReplay((prev) => {
            if (prev) {
              return {
                ...prev,
                current: prev.current + 1,
              };
            }
            return null;
          });
        }, ReplayConfig.speed === -1 ? action.time : ReplayConfig.speed);
      }
    } else if (showAutoPlayOverlay && autoPlaying && pendingReplay && pendingReplay.current >= pendingReplay.actions.length) {
      // Replay finished
      setPendingReplay(null);
      setHighlightedCell(undefined);
      lastPlayedStep.current = null;
      setShowAutoPlayOverlay(false);
      setAutoPlaying(false);
    }
  }, [autoPlaying, showAutoPlayOverlay, pendingReplay, gameStatus, board, rows, cols, handleCellClick, handleFlagCell, handleChordCell, addUserAction]);

  const onClickReplayButton = useCallback((seed: string, replayDifficulty: Difficulty, actions: UserActionDetail[]) => {
    if (replayDifficulty !== difficulty) {
      setDifficulty(replayDifficulty);
    } else {
      onDifficultyChange();
    }
    setShowAutoPlayOverlay(true);
    setPendingReplay({ seed, actions, current: 0 });
    skipHistory.current = true;;
  }, [difficulty, onDifficultyChange]);
  const onStartReplay = useCallback((speed: number) => {
    ReplayConfig.speed = speed;
    setAutoPlaying(true);
  }, []);

  const onCancelReplay = useCallback(() => {
    setShowAutoPlayOverlay(false);
    setAutoPlaying(false);
    setPendingReplay(null);
    lastPlayedStep.current = null;
  }, []);
  //#endregion

  return (
    <div className="flex h-screen w-screen max-w-screen max-h-screen justify-center items-start lg:gap-8 gap-4 p-4 bg-white dark:bg-gray-900">
      {/* Left side: Title, controls, board */}
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
        rows={rows}
        cols={cols}
        onCellAction={onCellAction}
        seed={seed}
        lastStepOnMine={revealedMinePosition}
      />

      {/* Right side: Sidebar - now responsive */}
      <GameSidebar
        leaderboards={leaderboards}
        difficulty={difficulty}
        userActions={userActions}
        setHighlightedCell={setHighlightedCell}
        playHistory={playHistory}
        onRetry={onRetry}
        onReplay={onClickReplayButton}
      />

      {/* Statistics Modal */}
      {showStats && (
        <StatisticsModal
          show={showStats}
          onClose={onCloseStats}
          playHistory={playHistory ?? []}
          onClearHistory={clearPlayHistory}
          onClearLeaderboard={clearLeaderboard}
        />
      )}
      {showAutoPlayOverlay &&
        <AutoGamingOverlay
          isAutoPlaying={autoPlaying}
          title={replayTitle}
          onCancelAutoPlay={onCancelReplay}
          onStartAutoPlay={onStartReplay}
        />
      }
    </div>
  )
}
