"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { CellType } from "./Cell";
import {
  easyMineSweeper,
  hardMineSweeper,
  mediumMineSweeper
} from "./utils/minesweeperLogic";
import { Difficulty, GameStatus, UserAction } from "./Game.types";
import React from "react";
import StatisticsModal from "./StatisticsModal";
import { useUserActions } from "./useUserActions";
import { useLeaderboard } from "./useLeaderboard";
import { usePlayHistory } from "./usePlayHistory";
import GameControls from "./GameControls";
import Board from "./Board";
import GameSidebar from "./GameSidebar";
import { useMineSweeperLogic } from "./useMineSweeperLogic";

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
  const [showStats, setShowStats] = useState(false);
  const { userActions, addUserAction, resetUserActions } = useUserActions();
  const { leaderboards, addEntry } = useLeaderboard();
  const { playHistory, addPlayHistoryEntry, clearPlayHistory } = usePlayHistory();
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
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameStatus]);

  const onBeginGame = useCallback((board: CellType[][], r: number, c: number) => {
    if (gameStatus === GameStatus.Init) {
      sweeper.generateBoardInPlace(board, r, c);
      setGameStatus(GameStatus.Gaming);
    }
  }, [gameStatus, sweeper]);

  const onWinOrLose = useCallback((status: GameStatus) => {
    setGameStatus(status);
    if (status === GameStatus.Win) {
      // Add entry to leaderboard
      const entry = {
        time: timer,
        date: new Date().toLocaleString(),
      };
      addEntry(difficulty, entry);
    }
    // Stop the timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Add history
    addPlayHistoryEntry({
      result: status === GameStatus.Win ? "Win" : "Loss",
      time: timer,
      difficulty,
    });
  }, [difficulty, timer, addEntry, addPlayHistoryEntry]);

  const { flagCount, handleCellClick, handleFlagCell, handleChordCell } = useMineSweeperLogic({
    board,
    setBoard,
    gameStatus,
    onBeginGame,
    onWinOrLose,
    sweeper,
  });

  const onCellAction = useCallback(
    (action: UserAction) => {
      let func: ((r: number, c: number) => number) | undefined = undefined;
      switch (action.type) {
        case "reveal":
          func = handleCellClick;
          break;
        case "flag":
          func = handleFlagCell;
          break;
        case "chord":
          func = handleChordCell;
          break;
        default:
          console.error("Unknown action type:", action.type);
          return 0;
      }
      const score = func(action.position.r, action.position.c);
      addUserAction({
        type: action.type,
        position: action.position,
        score,
      });
      return 0;
    }, [handleCellClick, handleFlagCell, handleChordCell, addUserAction]);

  const handleReset = useCallback((clear = true) => {
    if (clear) {
      setBoard((prevBoard) => {
        resetBoardInPlace(prevBoard);
        return [...prevBoard];
      });
    }
    setGameStatus(GameStatus.Init);
    setTimer(0);
    resetUserActions();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [resetBoardInPlace, resetUserActions]);

  useEffect(() => {
    setBoard(createEmptyBoard())
    handleReset(false);
  }, [difficulty, handleReset, createEmptyBoard]);

  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);

  const onCloseStats = useCallback(() => {
    setShowStats(false);
  }, []);    

  return (
    <div className="flex min-h-screen justify-center items-start gap-8 p-4 bg-white dark:bg-gray-900 overflow-x-hidden">
      {/* Left side: Title, controls, board */}
      <div className="flex flex-col items-center flex-1 min-w-[250px] max-w-full">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Minesweeper</h1>
        <GameControls
          difficulty={difficulty}
          setDifficulty={setDifficulty}
          mobileAction={mobileAction}
          setMobileAction={setMobileAction}
          timer={timer}
          handleReset={handleReset}
          faceEmoji={faceEmoji}
          mines={mines - flagCount}
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
      {/* Right side: Sidebar */}
      <GameSidebar
        leaderboards={leaderboards}
        difficulty={difficulty}
        userActions={userActions}
        setHoveredCell={setHoveredCell}
        playHistory={playHistory}
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
    </div>
  );
}
