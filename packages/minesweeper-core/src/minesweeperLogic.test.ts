import { describe, test, expect } from "vitest";
import {
    Board,
    easyMineSweeper,
    hardMineSweeper,
    mediumMineSweeper,
    mineSweeper,
} from "./minesweeperLogic";
import { CellType, Position } from "./types";

// Builds a board with given mines and computes adjacency counts.
// Used to construct deterministic boards for chord/flood-fill scenarios.
function boardWithMines(rows: number, cols: number, mines: Position[]): Board {
    const board: Board = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0,
        }))
    );
    for (const { r, c } of mines) board[r][c].isMine = true;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].isMine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) count++;
                }
            }
            board[r][c].adjacentMines = count;
        }
    }
    return board;
}

describe("createEmptyBoard", () => {
    test("returns ROWS x COLS board with all cells unrevealed/unflagged/non-mine", () => {
        const sw = mineSweeper(3, 4, 0);
        const board = sw.createEmptyBoard();
        expect(board.length).toBe(3);
        expect(board[0].length).toBe(4);
        const allBlank = board.every(row => row.every((c: CellType) =>
            !c.isRevealed && !c.isFlagged && !c.isMine && c.adjacentMines === 0
        ));
        expect(allBlank).toBe(true);
    });

    test("rows are independent arrays", () => {
        const sw = mineSweeper(2, 2, 0);
        const board = sw.createEmptyBoard();
        expect(board[0]).not.toBe(board[1]);
    });
});

describe("generateBoardInPlace", () => {
    test("places exactly MINES mines", () => {
        const sw = mineSweeper(9, 9, 10);
        const board = sw.createEmptyBoard();
        sw.generateBoardInPlace(board, 0, 0);
        const mineCount = board.flat().filter(c => c.isMine).length;
        expect(mineCount).toBe(10);
    });

    test("the safe cell is never a mine across many seeds", () => {
        const sw = mineSweeper(9, 9, 10);
        for (let i = 0; i < 50; i++) {
            const board = sw.createEmptyBoard();
            sw.generateBoardInPlace(board, 4, 4);
            expect(board[4][4].isMine).toBe(false);
        }
    });

    test("same seed (replay=true) produces identical mine layout", () => {
        const sw = mineSweeper(9, 9, 10);
        const a = sw.createEmptyBoard();
        const b = sw.createEmptyBoard();
        sw.generateBoardInPlace(a, 0, 0, "abc-1", true);
        sw.generateBoardInPlace(b, 0, 0, "abc-1", true);
        const aMines = a.flat().map(c => c.isMine);
        const bMines = b.flat().map(c => c.isMine);
        expect(aMines).toEqual(bMines);
    });

    test("non-replay call increments the seed iteration", () => {
        const sw = mineSweeper(9, 9, 10);
        const board = sw.createEmptyBoard();
        const seed = sw.generateBoardInPlace(board, 0, 0, "xyz-1", false);
        expect(seed).toBe("xyz-2");
    });

    test("invalid seed format is replaced with a fresh seed", () => {
        const sw = mineSweeper(9, 9, 10);
        const board = sw.createEmptyBoard();
        const seed = sw.generateBoardInPlace(board, 0, 0, "no-iteration-here", false);
        expect(seed).not.toBe("no-iteration-here");
        expect(seed).toMatch(/-1$/);
    });

    test("adjacent mine counts are correct for all non-mine cells", () => {
        const sw = mineSweeper(5, 5, 5);
        const board = sw.createEmptyBoard();
        sw.generateBoardInPlace(board, 0, 0, "test-1", true);
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                if (board[r][c].isMine) continue;
                let expected = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5 && board[nr][nc].isMine) expected++;
                    }
                }
                expect(board[r][c].adjacentMines).toBe(expected);
            }
        }
    });
});

describe("revealCellInPlace", () => {
    test("returns 0 when out of bounds (and does nothing)", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        const before = JSON.stringify(board);
        expect(sw.revealCellInPlace(board, -1, 0)).toBe(0);
        expect(sw.revealCellInPlace(board, 0, -1)).toBe(0);
        expect(sw.revealCellInPlace(board, 3, 0)).toBe(0);
        expect(sw.revealCellInPlace(board, 0, 3)).toBe(0);
        expect(JSON.stringify(board)).toBe(before);
    });

    test("returns 0 when cell already revealed", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        sw.revealCellInPlace(board, 1, 1);
        expect(sw.revealCellInPlace(board, 1, 1)).toBe(0);
    });

    test("returns 0 when cell is flagged", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        sw.toggleFlagInPlace(board, 1, 1);
        expect(sw.revealCellInPlace(board, 1, 1)).toBe(0);
        expect(board[1][1].isRevealed).toBe(false);
    });

    test("flood fills all connected zero-adjacent cells on an empty board", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        const count = sw.revealCellInPlace(board, 0, 0);
        expect(count).toBe(9);
        expect(board.every(row => row.every(c => c.isRevealed))).toBe(true);
    });

    test("flood fill stops at numbered cells (does not cross mine)", () => {
        // Mine at (0,0). Cells adjacent become "1"; the rest stay "0".
        // Flood from (2,2) should reveal everything except the mine.
        const board = boardWithMines(3, 3, [{ r: 0, c: 0 }]);
        const sw = mineSweeper(3, 3, 1);
        const count = sw.revealCellInPlace(board, 2, 2);
        expect(count).toBe(8);
        expect(board[0][0].isRevealed).toBe(false);
    });
});

describe("toggleFlagInPlace", () => {
    test("flags an unrevealed cell and returns true", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        expect(sw.toggleFlagInPlace(board, 1, 1)).toBe(true);
        expect(board[1][1].isFlagged).toBe(true);
    });

    test("unflags a flagged cell", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        sw.toggleFlagInPlace(board, 1, 1);
        expect(sw.toggleFlagInPlace(board, 1, 1)).toBe(true);
        expect(board[1][1].isFlagged).toBe(false);
    });

    test("returns false (no-op) on a revealed cell", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        sw.revealCellInPlace(board, 0, 0);
        expect(sw.toggleFlagInPlace(board, 1, 1)).toBe(false);
        expect(board[1][1].isFlagged).toBe(false);
    });
});

describe("countFlaggedAround", () => {
    test("counts flags in 8 neighbors only", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        sw.toggleFlagInPlace(board, 0, 0);
        sw.toggleFlagInPlace(board, 0, 1);
        sw.toggleFlagInPlace(board, 1, 0);
        expect(sw.countFlaggedAround(board, 1, 1)).toBe(3);
    });

    test("does not include the cell itself", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        sw.toggleFlagInPlace(board, 1, 1);
        expect(sw.countFlaggedAround(board, 1, 1)).toBe(0);
    });

    test("ignores out-of-bounds neighbors at corners", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        sw.toggleFlagInPlace(board, 0, 1);
        sw.toggleFlagInPlace(board, 1, 0);
        sw.toggleFlagInPlace(board, 1, 1);
        expect(sw.countFlaggedAround(board, 0, 0)).toBe(3);
    });
});

describe("revealAroundInPlace (chord)", () => {
    test("reveals all unflagged neighbors when flag count matches adjacentMines", () => {
        // Mine at (0,0). Reveal (1,1) which is "1". Flag (0,0). Chord (1,1).
        const board = boardWithMines(3, 3, [{ r: 0, c: 0 }]);
        const sw = mineSweeper(3, 3, 1);
        sw.revealCellInPlace(board, 1, 1);
        sw.toggleFlagInPlace(board, 0, 0);
        const { count, minePos } = sw.revealAroundInPlace(board, 1, 1);
        expect(minePos).toBeUndefined();
        expect(count).toBeGreaterThan(0);
        for (const [r, c] of [[0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]]) {
            expect(board[r][c].isRevealed).toBe(true);
        }
        expect(board[0][0].isFlagged).toBe(true);
        expect(board[0][0].isRevealed).toBe(false);
    });

    test("regression: chord that hits a mine still counts the safe cells revealed", () => {
        // Mine at (0,0). Reveal (1,1). Flag (0,1) (WRONG flag). Chord (1,1).
        // Old in-place version returned -1 sentinel and discarded safe count.
        const board = boardWithMines(3, 3, [{ r: 0, c: 0 }]);
        const sw = mineSweeper(3, 3, 1);
        sw.revealCellInPlace(board, 1, 1);
        sw.toggleFlagInPlace(board, 0, 1);
        const { count, minePos } = sw.revealAroundInPlace(board, 1, 1);
        expect(minePos).toEqual({ r: 0, c: 0 });
        expect(count).toBeGreaterThan(0);
        // Mines revealed (game-over UI).
        expect(board[0][0].isRevealed).toBe(true);
    });

    test("when mine is unflagged and unrevealed among neighbors, minePos is set", () => {
        const board = boardWithMines(3, 3, [{ r: 0, c: 0 }]);
        const sw = mineSweeper(3, 3, 1);
        sw.revealCellInPlace(board, 1, 1);
        const { minePos } = sw.revealAroundInPlace(board, 1, 1);
        expect(minePos).toEqual({ r: 0, c: 0 });
    });
});

describe("revealAllMinesInPlace", () => {
    test("reveals every mine", () => {
        const board = boardWithMines(3, 3, [{ r: 0, c: 0 }, { r: 2, c: 2 }]);
        const sw = mineSweeper(3, 3, 2);
        sw.revealAllMinesInPlace(board);
        expect(board[0][0].isRevealed).toBe(true);
        expect(board[2][2].isRevealed).toBe(true);
    });

    test("does not reveal non-mine cells", () => {
        const board = boardWithMines(3, 3, [{ r: 0, c: 0 }]);
        const sw = mineSweeper(3, 3, 1);
        sw.revealAllMinesInPlace(board);
        expect(board[1][1].isRevealed).toBe(false);
        expect(board[2][2].isRevealed).toBe(false);
    });

    test("no-op when there are no mines", () => {
        const board = boardWithMines(3, 3, []);
        const sw = mineSweeper(3, 3, 0);
        const before = JSON.stringify(board);
        sw.revealAllMinesInPlace(board);
        expect(JSON.stringify(board)).toBe(before);
    });
});

describe("preset difficulties", () => {
    test("easy is 9x9 with 10 mines", () => {
        const sw = easyMineSweeper();
        expect(sw.rows).toBe(9);
        expect(sw.cols).toBe(9);
        expect(sw.mines).toBe(10);
    });

    test("medium is 16x16 with 40 mines", () => {
        const sw = mediumMineSweeper();
        expect(sw.rows).toBe(16);
        expect(sw.cols).toBe(16);
        expect(sw.mines).toBe(40);
    });

    test("hard is 16x30 with 99 mines", () => {
        const sw = hardMineSweeper();
        expect(sw.rows).toBe(16);
        expect(sw.cols).toBe(30);
        expect(sw.mines).toBe(99);
    });
});
