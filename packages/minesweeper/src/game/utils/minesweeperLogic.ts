import { CellType, Position } from "../Game.types";

const aroundRC = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
];

export type Board = CellType[][];

export type RevealResult = {
    board: Board;
    count: number;
};

export type ChordResult = {
    board: Board;
    count: number;
    minePos?: Position;
};

// Simple seedable random number generator (Linear Congruential Generator)
class SeededRandom {
    private seed: number;

    constructor(seed: string) {
        this.seed = this.stringToSeed(seed);
    }

    private stringToSeed(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    next(): number {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return this.seed / 0x7fffffff;
    }

    nextInt(max: number): number {
        return Math.floor(this.next() * max);
    }
}

function generateSeed() {
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${randomPart}-1`;
}

export function mineSweeper(ROWS: number, COLS: number, MINES: number) {
    function createEmptyBoard(): Board {
        return Array.from({ length: ROWS }, () =>
            Array.from({ length: COLS }, () => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMines: 0,
            }))
        );
    }

    // Construct a fresh board with mines + adjacency counts.
    // Mutation is fine here — the board is being constructed, no one else holds a reference.
    function generateBoard(safeR: number, safeC: number, seedStr = "", replay = false): { board: Board; seed: string } {
        if (seedStr === "") {
            seedStr = generateSeed();
        } else if (!replay) {
            const parts = seedStr.split("-");
            if (parts.length < 2 || isNaN(parseInt(parts[1]))) {
                console.warn("Invalid seed format, generating a new seed.");
                seedStr = generateSeed();
            } else {
                const iteration = parseInt(parts[1]) + 1;
                seedStr = `${parts[0]}-${iteration}`;
            }
        }
        const seed = seedStr.split("-")[0];
        const rng = new SeededRandom(seed);

        const board = createEmptyBoard();

        let minesPlaced = 0;
        while (minesPlaced < MINES) {
            const r = rng.nextInt(ROWS);
            const c = rng.nextInt(COLS);
            if ((r === safeR && c === safeC) || board[r][c].isMine) continue;
            board[r][c].isMine = true;
            minesPlaced++;
        }

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (board[r][c].isMine) continue;
                let count = 0;
                for (const [dr, dc] of aroundRC) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].isMine) {
                        count++;
                    }
                }
                board[r][c].adjacentMines = count;
            }
        }

        return { board, seed: seedStr };
    }

    // Flood-fill discovery: collects keys (r*COLS + c) of cells that should become revealed.
    function floodFillInto(board: Board, r: number, c: number, visited: Set<number>): void {
        const stack: Array<[number, number]> = [[r, c]];
        while (stack.length) {
            const [row, col] = stack.pop()!;
            const key = row * COLS + col;
            if (visited.has(key)) continue;
            const cell = board[row][col];
            if (cell.isRevealed || cell.isFlagged) continue;
            visited.add(key);
            if (cell.adjacentMines === 0 && !cell.isMine) {
                for (const [dr, dc] of aroundRC) {
                    const nr = row + dr, nc = col + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                        stack.push([nr, nc]);
                    }
                }
            }
        }
    }

    // Build a new board with the cells in `visited` flipped to revealed.
    // Structural sharing: only changed rows are cloned.
    function applyReveals(board: Board, visited: Set<number>): Board {
        if (visited.size === 0) return board;
        const dirtyRows = new Map<number, CellType[]>();
        for (const key of visited) {
            const row = Math.floor(key / COLS);
            const col = key % COLS;
            if (!dirtyRows.has(row)) dirtyRows.set(row, [...board[row]]);
            dirtyRows.get(row)![col] = { ...board[row][col], isRevealed: true };
        }
        const newBoard = [...board];
        for (const [row, rowArr] of dirtyRows) newBoard[row] = rowArr;
        return newBoard;
    }

    function revealCell(board: Board, r: number, c: number): RevealResult {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return { board, count: 0 };
        const cell = board[r][c];
        if (cell.isRevealed || cell.isFlagged) return { board, count: 0 };
        const visited = new Set<number>();
        floodFillInto(board, r, c, visited);
        return { board: applyReveals(board, visited), count: visited.size };
    }

    function countFlaggedAround(board: Board, r: number, c: number): number {
        let count = 0;
        for (const [dr, dc] of aroundRC) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].isFlagged) {
                count++;
            }
        }
        return count;
    }

    // Chord: reveal all unflagged neighbors. If any neighbor is a mine, also reveal all mines.
    // Unlike the old in-place version, safe reveals are NOT discarded when a mine is hit.
    function revealAround(board: Board, r: number, c: number): ChordResult {
        const visited = new Set<number>();
        let minePos: Position | undefined;
        for (const [dr, dc] of aroundRC) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
            const neighbor = board[nr][nc];
            if (neighbor.isFlagged || neighbor.isRevealed) continue;
            if (neighbor.isMine) {
                if (!minePos) minePos = { r: nr, c: nc };
            } else {
                floodFillInto(board, nr, nc, visited);
            }
        }
        let newBoard = applyReveals(board, visited);
        if (minePos) newBoard = revealAllMines(newBoard);
        return { board: newBoard, count: visited.size, minePos };
    }

    function revealAllMines(board: Board): Board {
        const dirtyRows = new Map<number, CellType[]>();
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = board[r][c];
                if (cell.isMine && !cell.isRevealed) {
                    if (!dirtyRows.has(r)) dirtyRows.set(r, [...board[r]]);
                    dirtyRows.get(r)![c] = { ...cell, isRevealed: true };
                }
            }
        }
        if (dirtyRows.size === 0) return board;
        const newBoard = [...board];
        for (const [r, rowArr] of dirtyRows) newBoard[r] = rowArr;
        return newBoard;
    }

    function toggleFlag(board: Board, r: number, c: number): Board {
        const cell = board[r][c];
        if (cell.isRevealed) return board;
        const newRow = [...board[r]];
        newRow[c] = { ...cell, isFlagged: !cell.isFlagged };
        const newBoard = [...board];
        newBoard[r] = newRow;
        return newBoard;
    }

    return {
        mines: MINES,
        rows: ROWS,
        cols: COLS,
        generateBoard,
        revealCell,
        countFlaggedAround,
        revealAround,
        revealAllMines,
        toggleFlag,
        createEmptyBoard,
    };
}

export type Sweeper = ReturnType<typeof mineSweeper>;

export function easyMineSweeper() {
    return mineSweeper(9, 9, 10);
}

export function mediumMineSweeper() {
    return mineSweeper(16, 16, 40);
}

export function hardMineSweeper() {
    return mineSweeper(16, 30, 99);
}
