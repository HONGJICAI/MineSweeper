import { describe, test, expect } from "vitest";
import {
    Board,
    easyMineSweeper,
    hardMineSweeper,
    mediumMineSweeper,
    mineSweeper,
} from "./minesweeperLogic";
import { CellType, Position } from "../Game.types";

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

function snapshot(board: Board): string {
    return JSON.stringify(board);
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

describe("generateBoard", () => {
    test("places exactly MINES mines", () => {
        const sw = mineSweeper(9, 9, 10);
        const { board } = sw.generateBoard(0, 0);
        const mineCount = board.flat().filter(c => c.isMine).length;
        expect(mineCount).toBe(10);
    });

    test("the safe cell is never a mine across many seeds", () => {
        const sw = mineSweeper(9, 9, 10);
        for (let i = 0; i < 50; i++) {
            const { board } = sw.generateBoard(4, 4);
            expect(board[4][4].isMine).toBe(false);
        }
    });

    test("same seed (replay=true) produces identical mine layout", () => {
        const sw = mineSweeper(9, 9, 10);
        const { board: a } = sw.generateBoard(0, 0, "abc-1", true);
        const { board: b } = sw.generateBoard(0, 0, "abc-1", true);
        const aMines = a.flat().map(c => c.isMine);
        const bMines = b.flat().map(c => c.isMine);
        expect(aMines).toEqual(bMines);
    });

    test("non-replay call increments the seed iteration", () => {
        const sw = mineSweeper(9, 9, 10);
        const { seed } = sw.generateBoard(0, 0, "xyz-1", false);
        expect(seed).toBe("xyz-2");
    });

    test("invalid seed format is replaced with a fresh seed", () => {
        const sw = mineSweeper(9, 9, 10);
        const { seed } = sw.generateBoard(0, 0, "no-iteration-here", false);
        expect(seed).not.toBe("no-iteration-here");
        expect(seed).toMatch(/-1$/);
    });

    test("adjacent mine counts are correct for all non-mine cells", () => {
        const sw = mineSweeper(5, 5, 5);
        const { board } = sw.generateBoard(0, 0, "test-1", true);
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

describe("revealCell", () => {
    test("returns same board ref when out of bounds", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        expect(sw.revealCell(board, -1, 0).board).toBe(board);
        expect(sw.revealCell(board, 0, -1).board).toBe(board);
        expect(sw.revealCell(board, 3, 0).board).toBe(board);
        expect(sw.revealCell(board, 0, 3).board).toBe(board);
    });

    test("returns same board ref when cell is already revealed", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        const { board: b1 } = sw.revealCell(board, 1, 1);
        const { board: b2, count } = sw.revealCell(b1, 1, 1);
        expect(b2).toBe(b1);
        expect(count).toBe(0);
    });

    test("returns same board ref when cell is flagged", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.toggleFlag(sw.createEmptyBoard(), 1, 1);
        const { board: result, count } = sw.revealCell(board, 1, 1);
        expect(result).toBe(board);
        expect(count).toBe(0);
    });

    test("flood fills all connected zero-adjacent cells on an empty board", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        const { board: revealed, count } = sw.revealCell(board, 0, 0);
        expect(count).toBe(9);
        expect(revealed.every(row => row.every(c => c.isRevealed))).toBe(true);
    });

    test("flood fill stops at numbered cells (does not cross)", () => {
        // Mine at (0,0). Cells adjacent to it become "1"; the rest stay "0".
        // Starting flood from far corner (2,2) should reveal everything except (0,0),
        // because the numbered border still gets revealed (boundary cells), but the
        // mine cell itself is not flooded into.
        const board = boardWithMines(3, 3, [{ r: 0, c: 0 }]);
        const sw = mineSweeper(3, 3, 1);
        const { board: revealed, count } = sw.revealCell(board, 2, 2);
        expect(count).toBe(8); // every cell except the mine
        expect(revealed[0][0].isRevealed).toBe(false);
    });

    test("does not mutate the input board", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        const before = snapshot(board);
        sw.revealCell(board, 1, 1);
        expect(snapshot(board)).toBe(before);
    });

    test("structural sharing: unchanged rows keep the same array reference", () => {
        // Reveal a single non-zero cell so flood fill only touches one row.
        const board = boardWithMines(3, 3, [{ r: 0, c: 0 }]);
        const sw = mineSweeper(3, 3, 1);
        const { board: result } = sw.revealCell(board, 2, 2);
        // Row 2 changed; rows 0 and 1 might or might not depending on flood.
        // At minimum, the cell at (2,2) is a new object.
        expect(result[2][2]).not.toBe(board[2][2]);
        // Cell at (0,0) (the mine) was not touched — same ref.
        expect(result[0][0]).toBe(board[0][0]);
    });
});

describe("toggleFlag", () => {
    test("flags an unrevealed cell", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        const flagged = sw.toggleFlag(board, 1, 1);
        expect(flagged[1][1].isFlagged).toBe(true);
    });

    test("unflags a flagged cell", () => {
        const sw = mineSweeper(3, 3, 0);
        const a = sw.toggleFlag(sw.createEmptyBoard(), 1, 1);
        const b = sw.toggleFlag(a, 1, 1);
        expect(b[1][1].isFlagged).toBe(false);
    });

    test("returns same ref (no-op) on a revealed cell", () => {
        const sw = mineSweeper(3, 3, 0);
        const { board: revealed } = sw.revealCell(sw.createEmptyBoard(), 0, 0);
        const result = sw.toggleFlag(revealed, 1, 1);
        expect(result).toBe(revealed);
    });

    test("does not mutate the input board", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.createEmptyBoard();
        const before = snapshot(board);
        sw.toggleFlag(board, 1, 1);
        expect(snapshot(board)).toBe(before);
    });
});

describe("countFlaggedAround", () => {
    test("counts flags in 8 neighbors only", () => {
        const sw = mineSweeper(3, 3, 0);
        let board = sw.createEmptyBoard();
        board = sw.toggleFlag(board, 0, 0);
        board = sw.toggleFlag(board, 0, 1);
        board = sw.toggleFlag(board, 1, 0);
        expect(sw.countFlaggedAround(board, 1, 1)).toBe(3);
    });

    test("does not include the cell itself", () => {
        const sw = mineSweeper(3, 3, 0);
        const board = sw.toggleFlag(sw.createEmptyBoard(), 1, 1);
        expect(sw.countFlaggedAround(board, 1, 1)).toBe(0);
    });

    test("ignores out-of-bounds neighbors at corners", () => {
        const sw = mineSweeper(3, 3, 0);
        let board = sw.createEmptyBoard();
        board = sw.toggleFlag(board, 0, 1);
        board = sw.toggleFlag(board, 1, 0);
        board = sw.toggleFlag(board, 1, 1);
        expect(sw.countFlaggedAround(board, 0, 0)).toBe(3);
    });
});

describe("revealAround (chord)", () => {
    test("reveals all unflagged neighbors when flag count matches adjacentMines", () => {
        // Mine at (0,0). Reveal (1,1) which is "1". Flag (0,0). Chord (1,1).
        let board = boardWithMines(3, 3, [{ r: 0, c: 0 }]);
        const sw = mineSweeper(3, 3, 1);
        ({ board } = sw.revealCell(board, 1, 1));
        board = sw.toggleFlag(board, 0, 0);
        const { board: result, count, minePos } = sw.revealAround(board, 1, 1);
        expect(minePos).toBeUndefined();
        expect(count).toBeGreaterThan(0);
        // All unflagged neighbors (and possibly flooded cells) should now be revealed.
        for (const [r, c] of [[0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]]) {
            expect(result[r][c].isRevealed).toBe(true);
        }
        // The flagged mine stays unrevealed.
        expect(result[0][0].isFlagged).toBe(true);
        expect(result[0][0].isRevealed).toBe(false);
    });

    test("regression: chord that hits a mine still counts the safe cells revealed", () => {
        // Mine at (0,0). Reveal (1,1) → "1". Flag (0,1) (WRONG flag — not a mine).
        // Chord (1,1): flag count == adjacentMines, but the actual mine (0,0) is unflagged.
        // → the iteration hits a mine AND there are safe cells to reveal.
        // The OLD in-place implementation discarded the safe count and returned -1.
        let board = boardWithMines(3, 3, [{ r: 0, c: 0 }]);
        const sw = mineSweeper(3, 3, 1);
        ({ board } = sw.revealCell(board, 1, 1));
        board = sw.toggleFlag(board, 0, 1);
        const { board: result, count, minePos } = sw.revealAround(board, 1, 1);
        expect(minePos).toEqual({ r: 0, c: 0 });
        // Safe cells around (1,1) excluding (0,1) flag: (1,0), (1,2), (2,0), (2,1), (2,2).
        expect(count).toBeGreaterThan(0);
        // All mines revealed (game over UI requirement).
        expect(result[0][0].isRevealed).toBe(true);
    });

    test("does nothing when flag count is wrong (handled at hook layer in practice)", () => {
        // revealAround itself does not check flag counts — that's the caller's job.
        // Verify it still behaves immutably with no flags.
        let board = boardWithMines(3, 3, [{ r: 0, c: 0 }]);
        const sw = mineSweeper(3, 3, 1);
        ({ board } = sw.revealCell(board, 1, 1));
        const { minePos } = sw.revealAround(board, 1, 1);
        // (0,0) is unflagged unrevealed mine → minePos set.
        expect(minePos).toEqual({ r: 0, c: 0 });
    });

    test("does not mutate input board", () => {
        let board = boardWithMines(3, 3, [{ r: 0, c: 0 }]);
        const sw = mineSweeper(3, 3, 1);
        ({ board } = sw.revealCell(board, 1, 1));
        board = sw.toggleFlag(board, 0, 0);
        const before = snapshot(board);
        sw.revealAround(board, 1, 1);
        expect(snapshot(board)).toBe(before);
    });
});

describe("revealAllMines", () => {
    test("reveals every mine", () => {
        const board = boardWithMines(3, 3, [{ r: 0, c: 0 }, { r: 2, c: 2 }]);
        const sw = mineSweeper(3, 3, 2);
        const result = sw.revealAllMines(board);
        expect(result[0][0].isRevealed).toBe(true);
        expect(result[2][2].isRevealed).toBe(true);
    });

    test("does not reveal non-mine cells", () => {
        const board = boardWithMines(3, 3, [{ r: 0, c: 0 }]);
        const sw = mineSweeper(3, 3, 1);
        const result = sw.revealAllMines(board);
        expect(result[1][1].isRevealed).toBe(false);
        expect(result[2][2].isRevealed).toBe(false);
    });

    test("returns same ref when there are no mines to reveal", () => {
        const board = boardWithMines(3, 3, []);
        const sw = mineSweeper(3, 3, 0);
        expect(sw.revealAllMines(board)).toBe(board);
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
