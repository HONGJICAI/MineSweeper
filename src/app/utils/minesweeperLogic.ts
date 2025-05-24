import { CellType } from "../Cell";

// Game status enum
export enum GameStatus {
    Init = 0,
    Gaming = 1,
    GameOver = 2,
    Win = 3
}

export function mineSweeper(ROWS: number, COLS: number, MINES: number) {
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

    return {
        mines: MINES,
        rows: ROWS,
        cols: COLS,
        generateBoard,
        revealCellInPlace,
        checkWin,
        countFlaggedAround,
        revealAroundInPlace,
        revealAllMinesInPlace,
        createEmptyBoard,
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