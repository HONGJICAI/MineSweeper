"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { CellType } from "./Cell";
import {
  easyMineSweeper,
  hardMineSweeper,
  mediumMineSweeper
} from "./utils/minesweeperLogic";
import { GameStatus } from "./Game.types";
import React from "react";
import StatisticsModal from "./StatisticsModal";
import UserActionsList from "./UserActionsList";
import { useUserActions } from "./useUserActions";
import Leaderboard from "./Leaderboard";
import { useLeaderboard } from "./useLeaderboard";
import { usePlayHistory } from "./usePlayHistory";
import HistoryList from "./HistoryList";
import GameControls from "./GameControls";
import Board from "./Board";
import { useDesktopMouse } from "./useDesktopMouse";

// Add a type for difficulty
type Difficulty = "easy" | "medium" | "hard";

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

  const { mines, rows, cols, generateBoard, revealCellInPlace, checkWin, countFlaggedAround, revealAroundInPlace, revealAllMinesInPlace, createEmptyBoard } = sweeper;
  const emptyBoard = useMemo<CellType[][]>(() => createEmptyBoard(), [createEmptyBoard]);
  const [board, setBoard] = useState<CellType[][]>(emptyBoard);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Init);
  const [timer, setTimer] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const { userActions, addUserAction, resetUserActions } = useUserActions();
  const { leaderboards, addEntry } = useLeaderboard();
  const { playHistory, addPlayHistoryEntry } = usePlayHistory();
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

  // Update leaderboard on win
  useEffect(() => {
    if (gameStatus === GameStatus.Win) {
      const entry = {
        time: timer,
        date: new Date().toLocaleString(),
      };
      addEntry(difficulty, entry);
    }
  }, [gameStatus]);

  const prevGameStatus = useRef<GameStatus>(gameStatus);

  // Track play history on game end (win or loss)
  useEffect(() => {
    if (
      (gameStatus === GameStatus.Win || gameStatus === GameStatus.GameOver) &&
      prevGameStatus.current !== gameStatus
    ) {
      addPlayHistoryEntry({
        result: gameStatus === GameStatus.Win ? "Win" : "Loss",
        time: timer,
        difficulty,
      });
    }
    prevGameStatus.current = gameStatus;
  }, [gameStatus, timer, difficulty, addPlayHistoryEntry]);

  function handleChordCell(r: number, c: number) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return 0;
    if (board[r][c].isRevealed && board[r][c].adjacentMines > 0) {
      const flagged = countFlaggedAround(board, r, c);
      if (flagged === board[r][c].adjacentMines) {
        const revealedCount = revealAroundInPlace(board, r, c);
        const gameOver = revealedCount === -1;;
        if (gameOver) {
          revealAllMinesInPlace(board);
          setBoard([...board]);
          setGameStatus(GameStatus.GameOver);
          return -1;
        }
        const newBoard = [...board];
        setBoard(newBoard);
        if (checkWin(newBoard)) setGameStatus(GameStatus.Win);
        return revealedCount;
      }
    }
    return 0;
  }

  function handleFlagCell(r: number, c: number) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win
      || gameStatus === GameStatus.Init) return 0;
    const cell = board[r][c];
    if (cell.isRevealed) return 0;

    if (cell.isFlagged) {
      setFlagCount((count) => count - 1);
    } else {
      setFlagCount((count) => count + 1);
    }

    const newBoard = [...board];
    newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
    setBoard(newBoard);
    return 1;
  }

  function handleCellClick(r: number, c: number) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return 0;
    if (board === emptyBoard) {
      // First click: generate board with safe cell
      const newBoard = generateBoard(r, c);
      revealCellInPlace(newBoard, r, c);
      setBoard(newBoard);
      setGameStatus(GameStatus.Gaming);
      if (checkWin(newBoard)) setGameStatus(GameStatus.Win);
      return 1;
    }
    const cell = board[r][c];
    if (cell.isFlagged || cell.isRevealed) return 0;
    if (cell.isMine) {
      revealAllMinesInPlace(board);
      const newBoard = [...board];
      setBoard(newBoard);
      setGameStatus(GameStatus.GameOver);
      return -1;
    }
    revealCellInPlace(board, r, c);
    const newBoard = [...board];
    setBoard(newBoard);
    if (checkWin(newBoard)) setGameStatus(GameStatus.Win);
    return 1;
  }

  const handleReset = useCallback(() => {
    setBoard(emptyBoard);
    setGameStatus(GameStatus.Init);
    setTimer(0);
    setFlagCount(0);
    resetUserActions();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [emptyBoard, resetUserActions]);

  useEffect(() => {
    // Reset game when difficulty changes
    handleReset();
  }, [difficulty, handleReset]);

  const {
    mouseDownRef,
    mouseCell,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave,
  } = useDesktopMouse({
    gameStatus,
    handleFlagCell,
    handleChordCell,
    handleCellClick,
    addUserAction
  });

  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);


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
          mouseCell={mouseCell}
          mouseDownRef={mouseDownRef}
          gameStatus={gameStatus}
          hoveredCell={hoveredCell}
          rows={rows}
          cols={cols}
          handleMouseDown={handleMouseDown}
          handleMouseUp={handleMouseUp}
          handleMouseLeave={handleMouseLeave}
        />
      </div>
      {/* Right side: Leaderboard */}
      <div className="flex flex-col items-start flex-shrink-0 w-full max-w-xs">
        <Leaderboard leaderboards={leaderboards} difficulty={difficulty} />
        {/* User Actions List */}
        <UserActionsList userActions={userActions} setHoveredCell={setHoveredCell} />
        {/* Play History List */}
        <HistoryList playHistory={playHistory} />
      </div>
      {/* Statistics Modal */}
      {showStats && (
        <StatisticsModal
          show={showStats}
          onClose={() => setShowStats(false)}
          playHistory={playHistory ?? []}
        />
      )}
      {/* Show stats button */}
    </div>
  );
}
