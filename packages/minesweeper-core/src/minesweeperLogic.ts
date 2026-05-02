import { Board, CellType, Position } from "./types";

const aroundRC: ReadonlyArray<readonly [number, number]> = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
];

// Simple seedable random number generator (Linear Congruential Generator).
class SeededRandom {
    private seed: number;

    constructor(seed: string) {
        this.seed = SeededRandom.stringToSeed(seed);
    }

    private static stringToSeed(str: string): number {
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

function generateSeed(): string {
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${randomPart}-1`;
}

export type ChordResult = {
    count: number;
    minePos?: Position;
};

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

    // Mutates `board` in place: places mines + computes adjacency counts.
    // Returns the resolved seed string (with iteration applied).
    function generateBoardInPlace(
        board: Board,
        safeR: number,
        safeC: number,
        seedStr = "",
        replay = false,
    ): string {
        if (seedStr === "") {
            seedStr = generateSeed();
        } else if (!replay) {
            const parts = seedStr.split("-");
            if (parts.length < 2 || isNaN(parseInt(parts[1]))) {
                // Invalid seed format → silently fall back to a fresh seed.
                seedStr = generateSeed();
            } else {
                const iteration = parseInt(parts[1]) + 1;
                seedStr = `${parts[0]}-${iteration}`;
            }
        }
        const seed = seedStr.split("-")[0];
        const rng = new SeededRandom(seed);

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

        return seedStr;
    }

    // Mutates `board` in place: flood-fills from (r, c).
    // Returns the number of cells revealed (0 for out-of-bounds / already revealed / flagged).
    function revealCellInPlace(board: Board, r: number, c: number): number {
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return 0;
        const cell = board[r][c];
        if (cell.isRevealed || cell.isFlagged) return 0;

        const stack: Array<[number, number]> = [[r, c]];
        let revealedCount = 0;

        while (stack.length) {
            const [row, col] = stack.pop()!;
            const target = board[row][col];
            if (target.isRevealed || target.isFlagged) continue;
            target.isRevealed = true;
            revealedCount++;
            if (target.adjacentMines === 0 && !target.isMine) {
                for (const [dr, dc] of aroundRC) {
                    const nr = row + dr, nc = col + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                        const nb = board[nr][nc];
                        if (!nb.isRevealed && !nb.isFlagged) {
                            stack.push([nr, nc]);
                        }
                    }
                }
            }
        }
        return revealedCount;
    }

    // Pure read: counts flagged neighbors of (r, c).
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

    // Mutates `board` in place: chord-reveals neighbors.
    // If a mine is hit among neighbors, also reveals all mines (game-over UI).
    // Returns { count: safe cells revealed, minePos: optional first mine hit }.
    // Crucially: safe reveals are NOT discarded when a mine is also hit (regression fix).
    function revealAroundInPlace(board: Board, r: number, c: number): ChordResult {
        let count = 0;
        let minePos: Position | undefined;
        for (const [dr, dc] of aroundRC) {
            const nr = r + dr, nc = c + dc;
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
            const neighbor = board[nr][nc];
            if (neighbor.isFlagged || neighbor.isRevealed) continue;
            if (neighbor.isMine) {
                if (!minePos) minePos = { r: nr, c: nc };
            } else {
                count += revealCellInPlace(board, nr, nc);
            }
        }
        if (minePos) revealAllMinesInPlace(board);
        return { count, minePos };
    }

    function revealAllMinesInPlace(board: Board): void {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = board[r][c];
                if (cell.isMine && !cell.isRevealed) {
                    cell.isRevealed = true;
                }
            }
        }
    }

    // Mutates `board` in place: toggles flag at (r, c).
    // Returns true if the flag was toggled, false if no-op (cell already revealed).
    function toggleFlagInPlace(board: Board, r: number, c: number): boolean {
        const cell = board[r][c];
        if (cell.isRevealed) return false;
        cell.isFlagged = !cell.isFlagged;
        return true;
    }

    return {
        mines: MINES,
        rows: ROWS,
        cols: COLS,
        createEmptyBoard,
        generateBoardInPlace,
        revealCellInPlace,
        countFlaggedAround,
        revealAroundInPlace,
        revealAllMinesInPlace,
        toggleFlagInPlace,
    };
}

export type Sweeper = ReturnType<typeof mineSweeper>;

export function easyMineSweeper(): Sweeper {
    return mineSweeper(9, 9, 10);
}

export function mediumMineSweeper(): Sweeper {
    return mineSweeper(16, 16, 40);
}

export function hardMineSweeper(): Sweeper {
    return mineSweeper(16, 30, 99);
}

// Re-export CellType so consumers don't need a separate import path
export type { CellType };
