"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import Cell, { CellType } from "./Cell";

// Add the enum definition
enum GameStatus {
  Init = 0,
  Gaming = 1,
  GameOver = 2,
  Win = 3
}

const ROWS = 9;
const COLS = 9;
const MINES = 10;

function generateBoard(safeR: number, safeC: number): CellType[][] {
  // Create empty board
  const board: CellType[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );

  // Place mines
  let minesPlaced = 0;
  while (minesPlaced < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    // Don't place a mine on the first clicked cell
    if ((r === safeR && c === safeC) || board[r][c].isMine) continue;
    board[r][c].isMine = true;
    minesPlaced++;
  }

  // Calculate adjacent mines
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (
            r + dr >= 0 &&
            r + dr < ROWS &&
            c + dc >= 0 &&
            c + dc < COLS &&
            board[r + dr][c + dc].isMine
          ) {
            count++;
          }
        }
      }
      board[r][c].adjacentMines = count;
    }
  }

  return board;
}

function revealCellInPlace(board: CellType[][], r: number, c: number): boolean {
  if (
    r < 0 ||
    r >= ROWS ||
    c < 0 ||
    c >= COLS ||
    board[r][c].isRevealed ||
    board[r][c].isFlagged
  )
    return false;

  const stack = [[r, c]];

  while (stack.length) {
    const [row, col] = stack.pop()!;
    const cell = board[row][col];
    if (cell.isRevealed || cell.isFlagged) continue;
    cell.isRevealed = true;
    if (cell.adjacentMines === 0 && !cell.isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (
            nr >= 0 &&
            nr < ROWS &&
            nc >= 0 &&
            nc < COLS &&
            !(dr === 0 && dc === 0)
          ) {
            if (!board[nr][nc].isRevealed && !board[nr][nc].isMine) {
              stack.push([nr, nc]);
            }
          }
        }
      }
    }
  }
  return true;
}

function checkWin(board: CellType[][]): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = board[r][c];
      if (!cell.isMine && !cell.isRevealed) return false;
    }
  }
  return true;
}
// Helper: count flagged cells around (r, c)
function countFlaggedAround(board: CellType[][], r: number, c: number): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        if (board[nr][nc].isFlagged) count++;
      }
    }
  }
  return count;
}

// Helper: reveal all unflagged cells around (r, c)
function revealAroundInPlace(board: CellType[][], r: number, c: number): GameStatus {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (
        nr >= 0 && nr < ROWS &&
        nc >= 0 && nc < COLS &&
        !board[nr][nc].isFlagged &&
        !board[nr][nc].isRevealed
      ) {
        if (board[nr][nc].isMine) {
          return GameStatus.GameOver;
        }
        revealCellInPlace(board, nr, nc);
      }
    }
  }
  return GameStatus.Gaming;
}
function revealAllMines(board: CellType[][]) {
  const newBoard = board.map((row) =>
    row.map((cell) => (cell.isMine ? { ...cell, isRevealed: true } : cell))
  );
  return newBoard;
}
export default function Home() {
  const emptyBoard = useMemo<CellType[][]>(() =>
    Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      }))
    ), []);
  const [board, setBoard] = useState<CellType[][]>(emptyBoard);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Init);
  const [timer, setTimer] = useState(0);
  const [flagCount, setFlagCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mouseDownRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const [mouseCell, setMouseCell] = useState<{ r: number; c: number } | null>(null);
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

  // Mouse event handlers for chording
  function handleMouseDown(
    e: React.MouseEvent<HTMLButtonElement>,
    r: number,
    c: number
  ) {
    if (!board || gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
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

    // Only execute actions if mouse is released on the same cell it was pressed
    if (mouseCell && mouseCell.r === r && mouseCell.c === c) {
      // Handle chording (both buttons pressed on revealed cell)
      if (mouseDownRef.current.left &&
        mouseDownRef.current.right &&
        board[r][c].isRevealed &&
        board[r][c].adjacentMines > 0) {
        const flagged = countFlaggedAround(board, r, c);
        if (flagged === board[r][c].adjacentMines) {
          const gameOver = revealAroundInPlace(board, r, c) === GameStatus.GameOver;
          if (gameOver) {
            const newBoard = revealAllMines(board);
            setBoard(newBoard);
            setGameStatus(GameStatus.GameOver);
            return;
          }
          const newBoard = board.map(row =>
            row.map(cell => ({ ...cell }))
          );
          setBoard(newBoard);
          if (checkWin(newBoard)) setGameStatus(GameStatus.Win);
        }
      }
      // Handle left click (reveal cell)
      else if (mouseDownRef.current.left && e.button === 0) {
        handleCellClick(r, c);
      }
      // Handle right click (flag cell)
      else if (mouseDownRef.current.right && e.button === 2) {
        handleFlagCell(r, c);
      }
      setMouseCell(null); // Reset mouse cell after action
    }

    // Reset mouse state
    if (e.button === 0) mouseDownRef.current.left = false;
    if (e.button === 2) mouseDownRef.current.right = false;
  }

  // Handle mouse leave event
  function handleMouseLeave(
  ) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
    if (!mouseCell) return;

    setMouseCell(null);
    mouseDownRef.current.left = false;
    mouseDownRef.current.right = false;
  }

  // Move flagging logic to a separate function
  function handleFlagCell(r: number, c: number) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win || !board) return;
    const cell = board[r][c];
    if (cell.isRevealed) return;

    if (cell.isFlagged) {
      setFlagCount((count) => count - 1);
    } else {
      setFlagCount((count) => count + 1);
    }

    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
    setBoard(newBoard);
  }

  // Keep this to prevent context menu
  function handleRightClick(
    e: React.MouseEvent<HTMLButtonElement>,
  ) {
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
    const newBoard = board.map((row) =>
      row.map((cell) => ({ ...cell }))
    );
    setBoard(newBoard);
    if (checkWin(newBoard)) setGameStatus(GameStatus.Win);
  }

  function handleReset() {
    setBoard(emptyBoard);
    setGameStatus(GameStatus.Init);
    setTimer(0);
    setFlagCount(0);
  }

  return (
    <div className="flex flex-col items-center min-h-screen justify-center gap-6 p-4">
      <h1 className="text-3xl font-bold mb-2">Minesweeper</h1>
      <div className="flex gap-4 items-center mb-2">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleReset}
        >
          Reset
        </button>
        <span className="text-gray-800 font-semibold">
          Mines left: {MINES - (board ? flagCount : 0)}
        </span>
        <span className="text-gray-800 font-semibold">
          Time: {timer}s
        </span>
        {gameStatus === GameStatus.GameOver && (
          <span className="text-red-600 font-semibold">Game Over!</span>
        )}
        {gameStatus === GameStatus.Win && (
          <span className="text-green-600 font-semibold">You Win!</span>
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
          onContextMenu={(e) => e.preventDefault()} // Prevent default context menu
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
                />
              );
            })
          )}
        </div>
      ), [board, mouseCell, gameStatus])}
      <p className="text-gray-500 mt-4 text-sm">
        Left click to reveal. Right click to flag.
      </p>
    </div>
  );
}
