import type { GameState, Position, Tile } from "./types";

/** Solved board: [1, 2, …, size² − 1, null]. */
export function createSolvedBoard(size: number): Tile[] {
    const board: Tile[] = Array.from({ length: size * size - 1 }, (_, i) => i + 1);
    board.push(null);
    return board;
}

/** Solvable shuffled board produced by Fisher–Yates with a solvability filter. */
export function createBoard(size: number): Tile[] {
    return shuffleBoard(createSolvedBoard(size));
}

export function shuffleBoard(board: Tile[]): Tile[] {
    const shuffled = [...board];
    const size = Math.sqrt(board.length);

    do {
        // Fisher–Yates over everything except the trailing empty slot.
        for (let i = shuffled.length - 2; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
    } while (!isSolvable(shuffled, size));

    return shuffled;
}

/**
 * Standard 15-puzzle solvability test.
 * Odd width: solvable iff inversions are even.
 * Even width: solvable iff (empty-row-from-bottom is odd) === (inversions is even).
 */
export function isSolvable(board: Tile[], size: number): boolean {
    const inversions = countInversions(board);
    const emptyRowFromBottom = size - Math.floor(board.indexOf(null) / size);

    if (size % 2 === 1) {
        return inversions % 2 === 0;
    }
    return (emptyRowFromBottom % 2 === 1) === (inversions % 2 === 0);
}

/** Inversions among non-empty tiles. */
export function countInversions(board: Tile[]): number {
    let inversions = 0;
    const numbers = board.filter((tile): tile is number => tile !== null);

    for (let i = 0; i < numbers.length - 1; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
            if (numbers[i] > numbers[j]) inversions++;
        }
    }
    return inversions;
}

export function indexToPosition(index: number, size: number): Position {
    return { row: Math.floor(index / size), col: index % size };
}

export function positionToIndex(row: number, col: number, size: number): number {
    return row * size + col;
}

/** Indices that may be swapped with the empty slot (4-neighbourhood). */
export function getPossibleMoves(emptyIndex: number, size: number): number[] {
    const moves: number[] = [];
    const { row, col } = indexToPosition(emptyIndex, size);

    if (row > 0) moves.push(positionToIndex(row - 1, col, size));
    if (row < size - 1) moves.push(positionToIndex(row + 1, col, size));
    if (col > 0) moves.push(positionToIndex(row, col - 1, size));
    if (col < size - 1) moves.push(positionToIndex(row, col + 1, size));

    return moves;
}

export function canMove(tileIndex: number, emptyIndex: number, size: number): boolean {
    return getPossibleMoves(emptyIndex, size).includes(tileIndex);
}

/**
 * Returns a new state with the tile moved into the empty slot, or the same
 * state if the move is illegal. Sets `isCompleted` + `endTime` on the win move.
 */
export function moveTile(state: GameState, tileIndex: number): GameState {
    if (!canMove(tileIndex, state.emptyIndex, state.size)) return state;

    const newBoard = [...state.board];
    [newBoard[state.emptyIndex], newBoard[tileIndex]] = [newBoard[tileIndex], newBoard[state.emptyIndex]];

    const next: GameState = {
        ...state,
        board: newBoard,
        emptyIndex: tileIndex,
        moves: state.moves + 1,
    };

    if (isCompleted(newBoard)) {
        next.isCompleted = true;
        next.endTime = Date.now();
    }
    return next;
}

export function isCompleted(board: Tile[]): boolean {
    for (let i = 0; i < board.length - 1; i++) {
        if (board[i] !== i + 1) return false;
    }
    return board[board.length - 1] === null;
}

/** "mm:ss" formatter for elapsed milliseconds. */
export function formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/** Percentage of tiles (including the empty slot) that are in their goal position. */
export function getCompletionProgress(board: Tile[]): number {
    let correct = 0;
    for (let i = 0; i < board.length - 1; i++) {
        if (board[i] === i + 1) correct++;
    }
    if (board[board.length - 1] === null) correct++;
    return Math.round((correct / board.length) * 100);
}
