"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Cell, { CellType } from "./Cell";
import {
  easyMineSweeper,
  GameStatus,
  hardMineSweeper,
  mediumMineSweeper
} from "./utils/minesweeperLogic";
import React from "react";
import StatisticsModal from "./StatisticsModal";
import { Button } from "./components/Button";

// Add a type for difficulty
type Difficulty = "easy" | "medium" | "hard";

type LeaderboardEntry = {
  time: number;
  date: string;
};

type Leaderboards = {
  easy: LeaderboardEntry[];
  medium: LeaderboardEntry[];
  hard: LeaderboardEntry[];
};

type PlayHistoryEntry = {
  result: "Win" | "Loss";
  time: number;
  date: string;
  difficulty: Difficulty;
};

export default function Game(props: {
  difficulty?: Difficulty;
  initialMobileAction?: "reveal" | "flag";
}) {
  // Add difficulty state
  const [difficulty, setDifficulty] = useState<Difficulty>(props.difficulty ?? "easy");
  const [mobileAction, setMobileAction] = useState<"reveal" | "flag">("reveal");

  // Select the correct logic based on difficulty
  const sweeper = useMemo(() => {
    if (difficulty === "easy") return easyMineSweeper();
    if (difficulty === "medium") return mediumMineSweeper();
    return hardMineSweeper();
  }, [difficulty]);

  const { mines, rows, cols, generateBoard, revealCellInPlace, checkWin, countFlaggedAround, revealAroundInPlace, revealAllMinesInPlace, createEmptyBoard } = sweeper;
  const emptyBoard = useMemo<CellType[][]>(() => createEmptyBoard(), [sweeper, createEmptyBoard]);
  const [board, setBoard] = useState<CellType[][]>(emptyBoard);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Init);
  const [timer, setTimer] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [playHistory, setPlayHistory] = useState<PlayHistoryEntry[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mouseDownRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [mouseCell, setMouseCell] = useState<{ r: number; c: number } | null>(null);
  const isMobileRef = useRef(false);
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

  useEffect(() => {
    // Reset game when difficulty changes
    handleReset();
  }, [difficulty]);

  // Leaderboard state
  const [leaderboards, setLeaderboards] = useState<Leaderboards>({
    easy: [],
    medium: [],
    hard: [],
  });

  // Update leaderboard on win
  useEffect(() => {
    if (gameStatus === GameStatus.Win) {
      setLeaderboards((prev) => {
        const updated = { ...prev };
        const entry: LeaderboardEntry = {
          time: timer,
          date: new Date().toLocaleString(),
        };
        updated[difficulty] = [...updated[difficulty], entry]
          .sort((a, b) => a.time - b.time)
          .slice(0, 5); // Keep top 5
        return updated;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus]);

  // Track play history on game end (win or loss)
  useEffect(() => {
    if (gameStatus === GameStatus.Win || gameStatus === GameStatus.GameOver) {
      const newEntry: PlayHistoryEntry = {
        result: gameStatus === GameStatus.Win ? "Win" : "Loss",
        time: timer,
        date: new Date().toLocaleString(),
        difficulty,
      };
      setPlayHistory((prev) => [
        newEntry,
        ...prev,
      ].slice(0, 10)); // Keep last 10 games
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStatus]);

  function handleMouseDown(
    e: React.MouseEvent<HTMLButtonElement>,
    r: number,
    c: number
  ) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
    if (gameStatus === GameStatus.Init && e.button === 2) return;
    if (e.button === 0) mouseDownRef.current.left = true;
    if (e.button === 2) mouseDownRef.current.right = true;
    // Store which cell the mouse was pressed on
    setMouseCell({ r, c });
  }

  function handleMouseUp(
    e: React.MouseEvent<HTMLButtonElement>,
    r: number,
    c: number
  ) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
    if (isMobileRef.current) {
      return;
    }
    // Only execute actions if mouse is released on the same cell it was pressed
    if (mouseCell && mouseCell.r === r && mouseCell.c === c) {
      // Handle chording (both buttons pressed on revealed cell)
      if (mouseDownRef.current.left &&
        mouseDownRef.current.right) {
        handleChordCell(r, c);
      }
      // Handle left click (reveal cell)
      else if (mouseDownRef.current.left && e.button === 0) {
        handleCellClick(r, c);
      }
      // Handle right click (flag cell)
      else if (mouseDownRef.current.right && e.button === 2) {
        if (gameStatus === GameStatus.Gaming)
          handleFlagCell(r, c);
      }
      setMouseCell(null); // Reset mouse cell after action
    }

    // Reset mouse state
    if (e.button === 0) mouseDownRef.current.left = false;
    if (e.button === 2) mouseDownRef.current.right = false;
  }

  // Handle mouse leave event
  function handleMouseLeave() {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
    if (!mouseCell || isMobileRef.current) return;
    setMouseCell(null);
    mouseDownRef.current.left = false;
    mouseDownRef.current.right = false;
  }

  function handleChordCell(r: number, c: number) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
    if (board[r][c].isRevealed && board[r][c].adjacentMines > 0) {
      const flagged = countFlaggedAround(board, r, c);
      if (flagged === board[r][c].adjacentMines) {
        const gameOver = revealAroundInPlace(board, r, c) === GameStatus.GameOver;
        if (gameOver) {
          revealAllMinesInPlace(board);
          setBoard([...board]);
          setGameStatus(GameStatus.GameOver);
          return;
        }
        const newBoard = [...board];
        setBoard(newBoard);
        if (checkWin(newBoard)) setGameStatus(GameStatus.Win);
      }
    }
  }

  function handleFlagCell(r: number, c: number) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win
      || gameStatus === GameStatus.Init) return;
    const cell = board[r][c];
    if (cell.isRevealed) return;

    if (cell.isFlagged) {
      setFlagCount((count) => count - 1);
    } else {
      setFlagCount((count) => count + 1);
    }

    const newBoard = [...board];
    newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
    setBoard(newBoard);
  }

  // Keep this to prevent context menu
  function handleRightClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault(); // Only prevent default context menu
  }

  function handleCellClick(r: number, c: number) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
    if (board === emptyBoard) {
      // First click: generate board with safe cell
      const newBoard = generateBoard(r, c);
      revealCellInPlace(newBoard, r, c);
      setBoard(newBoard);
      setGameStatus(GameStatus.Gaming);
      if (checkWin(newBoard)) setGameStatus(GameStatus.Win);
      return;
    }
    const cell = board[r][c];
    if (cell.isFlagged || cell.isRevealed) return;
    if (cell.isMine) {
      const newBoard = board.map((row) =>
        row.map((cell) =>
          cell.isMine ? { ...cell, isRevealed: true } : cell
        )
      );
      setBoard(newBoard);
      setGameStatus(GameStatus.GameOver);
      return;
    }
    revealCellInPlace(board, r, c);
    const newBoard = [...board];
    setBoard(newBoard);
    if (checkWin(newBoard)) setGameStatus(GameStatus.Win);
  }

  function handleReset() {
    setBoard(emptyBoard);
    setGameStatus(GameStatus.Init);
    setTimer(0);
    setFlagCount(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  // Handle touch events for mobile
  function handleTouchStart(
    e: React.TouchEvent<HTMLButtonElement>,
    r: number,
    c: number
  ) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;

    // Prevent default to avoid double triggers
    e.preventDefault();
    isMobileRef.current = true;

    // Store the cell being touched
    setMouseCell({ r, c });
    mouseDownRef.current.left = true;
  }

  function handleTouchEnd(
    e: React.TouchEvent<HTMLButtonElement>,
    r: number,
    c: number
  ) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;

    if (mouseCell && mouseCell.r === r && mouseCell.c === c) {
      if (mobileAction === "flag") {
        handleFlagCell(r, c);
      } else {
        if (board[r][c].isRevealed) {
          handleChordCell(r, c);
        } else {
          handleCellClick(r, c);
        }
      }
    }

    // Reset states
    setMouseCell(null);
    mouseDownRef.current.left = false;
    mouseDownRef.current.right = false;
  }

  function handleTouchMove() {
  }

  return (
    <div className="flex min-h-screen justify-center items-start gap-8 p-4 bg-white dark:bg-gray-900 overflow-x-hidden">
      {/* Left side: Title, controls, board */}
      <div className="flex flex-col items-center flex-1 min-w-[250px] max-w-full">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Minesweeper</h1>
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
        <div className="mb-2 flex gap-2 justify-center">
          <Button onClick={() => setMobileAction("reveal")} active={mobileAction === "reveal"}>
            ⛏️
          </Button>
          <Button onClick={() => setMobileAction("flag")} active={mobileAction === "flag"}>
            🚩
          </Button>
        </div>
        <div className="flex gap-16 items-center mb-2">
          <span className="text-gray-800 dark:text-gray-200 font-semibold">
            ⏰ {timer}s
          </span>
          <Button onClick={handleReset} className="px-2 py-2">
            {faceEmoji}
          </Button>
          <span className="text-gray-800 dark:text-gray-200 font-semibold">
            💣 {mines - (board ? flagCount : 0)}
          </span>
        </div>
        {useMemo(() => (
          <div
            className="grid"
            style={{
              gridTemplateRows: `repeat(${rows}, 2rem)`,
              gridTemplateColumns: `repeat(${cols}, 2rem)`,
              gap: "2px",
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {board.map((row, r) =>
              row.map((cell, c) => {
                const canPress = !cell.isRevealed &&
                  !cell.isFlagged &&
                  gameStatus !== GameStatus.GameOver &&
                  gameStatus !== GameStatus.Win;
                const isPressed = canPress &&
                  mouseDownRef.current.left &&
                  mouseCell &&
                  mouseCell.r === r &&
                  mouseCell.c === c;
                const isNeighborPressed = canPress &&
                  mouseDownRef.current.left &&
                  mouseDownRef.current.right &&
                  mouseCell &&
                  (Math.abs(mouseCell.r - r) <= 1 && Math.abs(mouseCell.c - c) <= 1) &&
                  !(mouseCell.r === r && mouseCell.c === c);
                const showAsPressed = (isPressed ?? false) || (isNeighborPressed ?? false);
                return (
                  <Cell
                    key={`${r}-${c}`}
                    cell={cell}
                    r={r}
                    c={c}
                    isPressed={showAsPressed}
                    onContextMenu={handleRightClick}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={(e) => handleTouchStart(e, r, c)}
                    onTouchEnd={(e) => handleTouchEnd(e, r, c)}
                    onTouchMove={handleTouchMove}
                    onTouchCancel={handleTouchMove}
                  />
                );
              })
            )}
          </div>
        ), [board, mouseCell, gameStatus])}
        <p className="text-gray-500 dark:text-gray-400 mt-4 text-sm">
          Left click to reveal. Right click to flag.
          <br />
          On mobile: Tap to reveal, long-press to flag.
        </p>
      </div>
      {/* Right side: Leaderboard */}
      <div className="mt-6 w-full max-w-xs flex-shrink-0 min-w-[220px]">
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Leaderboard ({difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})
        </h2>
        <ol className="list-decimal list-inside bg-gray-100 dark:bg-gray-800 rounded p-3">
          {leaderboards[difficulty].length === 0 && (
            <li className="text-gray-500 dark:text-gray-400">No records yet.</li>
          )}
          {leaderboards[difficulty].map((entry, idx) => (
            <li key={idx} className="flex justify-between">
              <span>{entry.time}s</span>
              <span className="text-xs text-gray-400 ml-2">{entry.date}</span>
            </li>
          ))}
        </ol>
      </div>
      {/* Statistics Modal */}
      {showStats && (
        <StatisticsModal
          show={showStats}
          onClose={() => setShowStats(false)}
          playHistory={playHistory}
        />
      )}
      {/* Show stats button */}
    </div>
  );
}
