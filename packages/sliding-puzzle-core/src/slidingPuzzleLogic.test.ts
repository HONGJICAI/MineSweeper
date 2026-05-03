import { afterEach, describe, expect, test, vi } from "vitest";
import {
    canMove,
    countInversions,
    createBoard,
    createSolvedBoard,
    formatTime,
    getCompletionProgress,
    getPossibleMoves,
    indexToPosition,
    isCompleted,
    isSolvable,
    moveTile,
    positionToIndex,
} from "./slidingPuzzleLogic";
import type { GameState, Tile } from "./types";

function freshState(board: Tile[]): GameState {
    const size = Math.sqrt(board.length);
    return {
        board,
        size,
        emptyIndex: board.indexOf(null),
        moves: 0,
        startTime: 0,
        endTime: null,
        isCompleted: false,
    };
}

describe("createSolvedBoard", () => {
    test("3x3 is [1..8, null]", () => {
        expect(createSolvedBoard(3)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, null]);
    });

    test("4x4 has 16 cells, last is null", () => {
        const board = createSolvedBoard(4);
        expect(board).toHaveLength(16);
        expect(board[15]).toBeNull();
        expect(board.slice(0, 15)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    });
});

describe("createBoard", () => {
    test("preserves the tile multiset and is solvable", () => {
        for (const size of [3, 4, 5]) {
            const board = createBoard(size);
            expect(board).toHaveLength(size * size);
            expect(board.filter((t) => t === null)).toHaveLength(1);
            const numbers = board.filter((t): t is number => t !== null).sort((a, b) => a - b);
            expect(numbers).toEqual(Array.from({ length: size * size - 1 }, (_, i) => i + 1));
            expect(isSolvable(board, size)).toBe(true);
        }
    });
});

describe("countInversions", () => {
    test("solved board has 0 inversions", () => {
        expect(countInversions([1, 2, 3, 4, 5, 6, 7, 8, null])).toBe(0);
    });

    test("counts inversions ignoring the empty slot", () => {
        // Sequence 2,1 -> 1 inversion; null is skipped.
        expect(countInversions([2, 1, null, 3])).toBe(1);
    });

    test("fully reversed 3x3 (sans empty) has 8*7/2 = 28 inversions", () => {
        expect(countInversions([8, 7, 6, 5, 4, 3, 2, 1, null])).toBe(28);
    });
});

describe("isSolvable", () => {
    test("solved 3x3 is solvable", () => {
        expect(isSolvable([1, 2, 3, 4, 5, 6, 7, 8, null], 3)).toBe(true);
    });

    test("classic unsolvable 3x3 (single 1<->2 swap)", () => {
        expect(isSolvable([2, 1, 3, 4, 5, 6, 7, 8, null], 3)).toBe(false);
    });

    test("solved 4x4 is solvable", () => {
        const solved = createSolvedBoard(4);
        expect(isSolvable(solved, 4)).toBe(true);
    });

    test("classic unsolvable 4x4 (14<->15 swap)", () => {
        const board = createSolvedBoard(4);
        [board[12], board[13]] = [board[13], board[12]]; // swap 13 and 14 to flip parity
        // Actually do the textbook 14<->15 swap:
        const ref = createSolvedBoard(4);
        [ref[13], ref[14]] = [ref[14], ref[13]];
        expect(isSolvable(ref, 4)).toBe(false);
    });
});

describe("indexToPosition / positionToIndex", () => {
    test("round trip on 4x4", () => {
        for (let i = 0; i < 16; i++) {
            const { row, col } = indexToPosition(i, 4);
            expect(positionToIndex(row, col, 4)).toBe(i);
        }
    });

    test("known positions on 3x3", () => {
        expect(indexToPosition(0, 3)).toEqual({ row: 0, col: 0 });
        expect(indexToPosition(4, 3)).toEqual({ row: 1, col: 1 });
        expect(indexToPosition(8, 3)).toEqual({ row: 2, col: 2 });
    });
});

describe("getPossibleMoves", () => {
    test("center of 3x3 has 4 neighbours", () => {
        expect(getPossibleMoves(4, 3).sort((a, b) => a - b)).toEqual([1, 3, 5, 7]);
    });

    test("top-left corner has 2", () => {
        expect(getPossibleMoves(0, 3).sort((a, b) => a - b)).toEqual([1, 3]);
    });

    test("bottom-right corner has 2", () => {
        expect(getPossibleMoves(8, 3).sort((a, b) => a - b)).toEqual([5, 7]);
    });

    test("edge (non-corner) has 3", () => {
        expect(getPossibleMoves(1, 3).sort((a, b) => a - b)).toEqual([0, 2, 4]);
    });
});

describe("canMove", () => {
    test("adjacent index is movable", () => {
        expect(canMove(7, 8, 3)).toBe(true); // left of empty
        expect(canMove(5, 8, 3)).toBe(true); // above empty
    });

    test("diagonal/non-adjacent is not movable", () => {
        expect(canMove(4, 8, 3)).toBe(false);
        expect(canMove(0, 8, 3)).toBe(false);
    });
});

describe("moveTile", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test("legal move swaps tile and increments moves", () => {
        const state = freshState([1, 2, 3, 4, 5, 6, 7, null, 8]);
        const next = moveTile(state, 8);
        expect(next.board).toEqual([1, 2, 3, 4, 5, 6, 7, 8, null]);
        expect(next.emptyIndex).toBe(8);
        expect(next.moves).toBe(1);
    });

    test("illegal move returns the same state object", () => {
        const state = freshState([1, 2, 3, 4, 5, 6, 7, null, 8]);
        // index 0 is not adjacent to empty at index 7
        expect(moveTile(state, 0)).toBe(state);
    });

    test("winning move sets isCompleted and endTime", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));

        const state = freshState([1, 2, 3, 4, 5, 6, 7, null, 8]);
        const next = moveTile(state, 8);

        expect(next.isCompleted).toBe(true);
        expect(next.endTime).toBe(Date.parse("2025-01-01T00:00:00Z"));
    });

    test("non-winning move does not set isCompleted", () => {
        const state = freshState([1, 2, 3, 4, 5, 6, null, 7, 8]);
        const next = moveTile(state, 7);
        expect(next.isCompleted).toBe(false);
        expect(next.endTime).toBeNull();
    });
});

describe("isCompleted", () => {
    test("solved board is completed", () => {
        expect(isCompleted([1, 2, 3, 4, 5, 6, 7, 8, null])).toBe(true);
    });

    test("misplaced tile is not completed", () => {
        expect(isCompleted([2, 1, 3, 4, 5, 6, 7, 8, null])).toBe(false);
    });

    test("empty slot in the wrong place is not completed", () => {
        expect(isCompleted([1, 2, 3, 4, 5, 6, 7, null, 8])).toBe(false);
    });
});

describe("formatTime", () => {
    test("zero", () => {
        expect(formatTime(0)).toBe("00:00");
    });

    test("under a minute", () => {
        expect(formatTime(45_000)).toBe("00:45");
    });

    test("over a minute", () => {
        expect(formatTime(125_000)).toBe("02:05");
    });

    test("ignores sub-second fragments", () => {
        expect(formatTime(1_999)).toBe("00:01");
    });
});

describe("getCompletionProgress", () => {
    test("solved board is 100%", () => {
        expect(getCompletionProgress([1, 2, 3, 4, 5, 6, 7, 8, null])).toBe(100);
    });

    test("fully scrambled with empty in last slot is partial", () => {
        // Only the trailing null is correctly placed.
        const progress = getCompletionProgress([8, 7, 6, 5, 4, 3, 2, 1, null]);
        expect(progress).toBe(Math.round((1 / 9) * 100));
    });

    test("8 of 9 placed correctly", () => {
        // tiles 1..7 in place, but null at slot 7 and 8 at slot 8 — only 7 are correct.
        expect(getCompletionProgress([1, 2, 3, 4, 5, 6, 7, null, 8])).toBe(Math.round((7 / 9) * 100));
    });
});
