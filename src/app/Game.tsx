"use client";
import { useState, useEffect, useRef, useMemo, useCallback, use } from "react";
import { CellType } from "./Cell";
import {
  easyMineSweeper,
  hardMineSweeper,
  mediumMineSweeper
} from "./utils/minesweeperLogic";
import { Difficulty, GameStatus, Position, UserAction, UserActionWithScore } from "./Game.types";
import React from "react";
import StatisticsModal from "./StatisticsModal";
import { useUserActions } from "./hooks/useUserActions";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { usePlayHistory } from "./hooks/usePlayHistory";
import GameCoreArea from "./GameCoreArea";
import GameSidebar from "./GameSidebar";
import { useMineSweeperLogic } from "./hooks/useMineSweeperLogic";
import AutoGamingOverlay from "./AutoGamingOverlay";

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
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<number>(0);
  const [showStats, setShowStats] = useState(false);
  const { userActions, addUserAction, resetUserActions } = useUserActions();
  const { leaderboards, addEntry } = useLeaderboard();
  const { playHistory, addPlayHistoryEntry, clearPlayHistory } = usePlayHistory();
  const [seed, setSeed] = useState<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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

  // Timer effect
  useEffect(() => {
    if (gameStatus === GameStatus.Gaming) {
      intervalRef.current = setInterval(() => {
        setTimer((t) => t + 1);
        timerRef.current += 1;
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameStatus, timerRef]);

  const onBeginGame = useCallback((board: CellType[][], r: number, c: number, seed?: string) => {
    if (gameStatus === GameStatus.Init) {
      const generatedSeed = sweeper.generateBoardInPlace(board, r, c, seed);
      setSeed(generatedSeed);
      setGameStatus(GameStatus.Gaming);
    }
  }, [gameStatus, sweeper]);

  const onWinOrLose = useCallback((status: GameStatus) => {
    setGameStatus(status);
    if (status === GameStatus.Win) {
      // Add entry to leaderboard
      const entry = {
        time: timerRef.current,
        date: new Date().toLocaleString(),
      };
      addEntry(difficulty, entry);
    }
    // Add history
    addPlayHistoryEntry({
      result: status === GameStatus.Win ? "Win" : "Loss",
      time: timerRef.current,
      difficulty,
      seed,
      actions: userActions,
    });
    // Stop the timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      timerRef.current = 0;
    }
  }, [addEntry, addPlayHistoryEntry, difficulty, seed, userActions, timerRef]);

  const { flagCount, handleCellClick, handleFlagCell, handleChordCell } = useMineSweeperLogic({
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
      let func: ((r: number, c: number) => number) | undefined = action2function[action.type] ? action2function[action.type] : undefined;
      if (!func) {
        console.warn(`No function found for action type: ${action.type}`);
        return;
      }
      const score = func(action.position.r, action.position.c);
      addUserAction({
        type: action.type,
        position: action.position,
        score,
      });
    }, [handleCellClick, handleFlagCell, handleChordCell, addUserAction]);

  const handleReset = useCallback((clear = true) => {
    if (clear) {
      setBoard((prevBoard) => {
        resetBoardInPlace(prevBoard);
        return [...prevBoard];
      });
      setSeed("");
    }
    setGameStatus(GameStatus.Init);
    setTimer(0);
    timerRef.current = 0;
    setSeed("");
    resetUserActions();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [resetBoardInPlace, resetUserActions, timerRef]);

  const onDifficultyChange = useCallback(() => {
    setBoard(createEmptyBoard())
    handleReset(false);
  }, [handleReset, createEmptyBoard]);

  useEffect(() => {
    onDifficultyChange();
  }, [difficulty, onDifficultyChange]);

  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);

  const onCloseStats = useCallback(() => {
    setShowStats(false);
  }, []);

  //#region Retry logic
  const [pendingRetry, setPendingRetry] = useState<{ seed: string; firstStep: Position } | null>(null);

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
      });
      setPendingRetry(null);
    }
  }, [pendingRetry, gameStatus, board, rows, cols, handleCellClick, addUserAction]);
  //#endregion

  //#region Replay logic
  const [pendingReplay, setPendingReplay] = useState<{ seed: string; actions: UserActionWithScore[], current: number } | null>(null);
  const lastPlayedStep = useRef<number | null>(null);

  useEffect(() => {
    if (pendingReplay && (gameStatus === GameStatus.Init || gameStatus === GameStatus.Gaming) && board.length === rows && board[0]?.length === cols) {
      if (pendingReplay.current < pendingReplay.actions.length && lastPlayedStep.current !== pendingReplay.current) {
        const action = pendingReplay.actions[pendingReplay.current];
        const step = action.position;
        if (action.type === "reveal") {
          handleCellClick(step.r, step.c, pendingReplay.seed);
        } else if (action.type === "flag") {
          handleFlagCell(step.r, step.c);
        } else if (action.type === "chord") {
          handleChordCell(step.r, step.c);
        }
        addUserAction({
          type: action.type,
          position: step,
          score: action.score,
        });
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
        }
          , 500);
      }
    } else if (pendingReplay && pendingReplay.current >= pendingReplay.actions.length) {
      // Replay finished
      setPendingReplay(null);
      lastPlayedStep.current = null;
      if (gameStatus === GameStatus.Init) {
        setGameStatus(GameStatus.Gaming);
      }
    }

  }
    , [pendingReplay, gameStatus, board, rows, cols, handleCellClick, handleFlagCell, handleChordCell, addUserAction]);

  const onReplay = useCallback((seed: string, replayDifficulty: Difficulty, actions: UserActionWithScore[]) => {
    if (replayDifficulty !== difficulty) {
      setDifficulty(replayDifficulty);
    } else {
      onDifficultyChange();
    }
    setPendingReplay({ seed, actions, current: 0 });
  }, [difficulty, onDifficultyChange]);
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
        timer={timer}
        handleReset={handleReset}
        faceEmoji={faceEmoji}
        mines={mines - flagCount}
        setShowStats={setShowStats}
        board={board}
        gameStatus={gameStatus}
        hoveredCell={hoveredCell}
        rows={rows}
        cols={cols}
        onCellAction={onCellAction}
        seed={seed}
      />

      {/* Right side: Sidebar - now responsive */}
      <GameSidebar
        leaderboards={leaderboards}
        difficulty={difficulty}
        userActions={userActions}
        setHoveredCell={setHoveredCell}
        playHistory={playHistory}
        onRetry={onRetry}
        onReplay={onReplay}
      />

      {/* Statistics Modal */}
      {showStats && (
        <StatisticsModal
          show={showStats}
          onClose={onCloseStats}
          playHistory={playHistory ?? []}
          onClearHistory={clearPlayHistory}
        />
      )}
      <AutoGamingOverlay
        isAutoPlaying={!!pendingReplay}
        onCancelAutoPlay={() => setPendingReplay(null)}
      />
    </div>
  );
}
