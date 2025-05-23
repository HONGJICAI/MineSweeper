"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Cell, { CellType } from "./Cell";
import {
  GameStatus,
  ROWS,
  COLS,
  MINES,
  generateBoard,
  revealCellInPlace,
  checkWin,
  countFlaggedAround,
  revealAroundInPlace,
  revealAllMinesInPlace,
  createEmptyBoard
} from "./utils/minesweeperLogic";

export default function Home() {
  const emptyBoard = useMemo<CellType[][]>(() => createEmptyBoard(), []);
  const [board, setBoard] = useState<CellType[][]>(emptyBoard);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Init);
  const [timer, setTimer] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mouseDownRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [mouseCell, setMouseCell] = useState<{ r: number; c: number } | null>(null);
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobileRef = useRef(false);

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

    // Set a timeout for long press (flag)
    longPressTimeoutRef.current = setTimeout(() => {
      if (!board[r][c].isRevealed) {
        // execute immediately if long press
        handleFlagCell(r, c);
      }
    }, 500); // 500ms for long press
  }

  function handleTouchEnd(
    e: React.TouchEvent<HTMLButtonElement>,
    r: number,
    c: number
  ) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;

    // Clear the long press timeout
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    // If touch ends on the same cell and it wasn't a long press, handle as a click
    if (mouseCell && mouseCell.r === r && mouseCell.c === c) {
      if (board[r][c].isRevealed) {
        handleChordCell(r, c);
      } else {
        handleCellClick(r, c);
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
    <div className="flex flex-col items-center min-h-screen justify-center gap-6 p-4 bg-white dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Minesweeper</h1>
      <div className="flex gap-4 items-center mb-2">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          onClick={handleReset}
        >
          Reset
        </button>
        <span className="text-gray-800 dark:text-gray-200 font-semibold">
          Mines left: {MINES - (board ? flagCount : 0)}
        </span>
        <span className="text-gray-800 dark:text-gray-200 font-semibold">
          Time: {timer}s
        </span>
        {gameStatus === GameStatus.GameOver && (
          <span className="text-red-600 dark:text-red-400 font-semibold">Game Over!</span>
        )}
        {gameStatus === GameStatus.Win && (
          <span className="text-green-600 dark:text-green-400 font-semibold">You Win!</span>
        )}
      </div>
      {useMemo(() => (
        <div
          className="grid"
          style={{
            gridTemplateRows: `repeat(${ROWS}, 2rem)`,
            gridTemplateColumns: `repeat(${COLS}, 2rem)`,
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
  );
}
