import { CellType } from "../Cell";

const aroundRC = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
];

// Simple seedable random number generator (Linear Congruential Generator)
class SeededRandom {
    private seed: number;

    constructor(seed: string) {
        // Convert string seed to number
        this.seed = this.stringToSeed(seed);
    }

    private stringToSeed(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    // Linear Congruential Generator
    next(): number {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return this.seed / 0x7fffffff;
    }

    // Generate random integer between 0 (inclusive) and max (exclusive)
    nextInt(max: number): number {
        return Math.floor(this.next() * max);
    }
}

function generateSeed() {
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `${randomPart}`;
}

export function mineSweeper(ROWS: number, COLS: number, MINES: number) {
    function generateBoardInPlace(board: CellType[][], safeR: number, safeC: number, seed = "") {
        if (seed === "") {
            // Generate a random seed if not provided
            seed = generateSeed();
            console.log(`Generated seed: ${seed}`);
        }

        const rng = new SeededRandom(seed);
        // Place mines
        let minesPlaced = 0;
        while (minesPlaced < MINES) {
            const r = rng.nextInt(ROWS);
            const c = rng.nextInt(COLS);
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

        return seed;
    }

    function revealCellInPlace(board: CellType[][], r: number, c: number): number {
        if (
            r < 0 ||
            r >= ROWS ||
            c < 0 ||
            c >= COLS ||
            board[r][c].isRevealed ||
            board[r][c].isFlagged
        )
            return 0;

        const stack = [[r, c]];
        let revealedCount = 0;

        while (stack.length) {
            const [row, col] = stack.pop()!;
            const cell = board[row][col];
            if (cell.isRevealed || cell.isFlagged) continue;
            cell.isRevealed = true;
            revealedCount++;
            if (cell.adjacentMines === 0 && !cell.isMine) {
                for (const [dr, dc] of aroundRC) {
                    const nr = row + dr, nc = col + dc;
                    if (
                        nr >= 0 && nr < ROWS &&
                        nc >= 0 && nc < COLS &&
                        !board[nr][nc].isRevealed &&
                        !board[nr][nc].isFlagged
                    ) {
                        stack.push([nr, nc]);
                    }
                }
            }
        }
        return revealedCount;
    }

    // Helper: count flagged cells around (r, c)
    function countFlaggedAround(board: CellType[][], r: number, c: number): number {
        let count = 0;
        for (const [dr, dc] of aroundRC) {
            const nr = r + dr, nc = c + dc;
            if (
                nr >= 0 && nr < ROWS &&
                nc >= 0 && nc < COLS &&
                board[nr][nc].isFlagged
            ) {
                count++;
            }
        }
        return count;
    }

    // Helper: reveal all unflagged cells around (r, c)
    function revealAroundInPlace(board: CellType[][], r: number, c: number): number {
        let revealedCount = 0;
        for (const [dr, dc] of aroundRC) {
            const nr = r + dr, nc = c + dc;
            if (
                nr >= 0 && nr < ROWS &&
                nc >= 0 && nc < COLS &&
                !board[nr][nc].isFlagged &&
                !board[nr][nc].isRevealed
            ) {
                if (board[nr][nc].isMine) {
                    return -1; // Game over
                }
                revealedCount += revealCellInPlace(board, nr, nc);
            }
        }
        return revealedCount;
    }

    function revealAllMinesInPlace(board: CellType[][]) {
        board.forEach((row) => {
            row.forEach((cell) => {
                if (cell.isMine) {
                    cell.isRevealed = true;
                }
            });
        });
    }

    // Helper function to create an empty board
    function createEmptyBoard(): CellType[][] {
        return Array.from({ length: ROWS }, () =>
            Array.from({ length: COLS }, () => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMines: 0,
            }))
        );
    }

    function resetBoardInPlace(board: CellType[][]) {
        for (let r = 0; r < board.length; r++) {
            for (let c = 0; c < board[0].length; c++) {
                board[r][c] = {
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacentMines: 0,
                };
            }
        }
    }

    return {
        mines: MINES,
        rows: ROWS,
        cols: COLS,
        generateBoardInPlace,
        revealCellInPlace,
        countFlaggedAround,
        revealAroundInPlace,
        revealAllMinesInPlace,
        createEmptyBoard,
        resetBoardInPlace,
    }
}

export function easyMineSweeper() {
    return mineSweeper(9, 9, 10);
}

export function mediumMineSweeper() {
    return mineSweeper(16, 16, 40);
}

export function hardMineSweeper() {
    return mineSweeper(16, 30, 99);
}