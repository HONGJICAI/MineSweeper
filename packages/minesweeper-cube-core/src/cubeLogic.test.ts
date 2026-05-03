import { describe, test, expect } from "vitest";
import { cubeMineSweeper, easyCubeSweeper, hardCubeSweeper, mediumCubeSweeper } from "./cubeLogic";
import { FACES, type Cube, type CubePosition } from "./types";
import { forEachCell, getNeighbors } from "./cubeTopology";

function countMines(cube: Cube): number {
    let n = 0;
    forEachCell(cube, c => { if (c.isMine) n++; });
    return n;
}

function countRevealed(cube: Cube): number {
    let n = 0;
    forEachCell(cube, c => { if (c.isRevealed) n++; });
    return n;
}

describe("generateBoardInPlace", () => {
    test("places exactly MINES mines", () => {
        const sw = cubeMineSweeper(5, 22);
        const cube = sw.emptyCube();
        sw.generateBoardInPlace(cube, { face: "F", r: 0, c: 0 });
        expect(countMines(cube)).toBe(22);
    });

    test("safe cell is never a mine across many seeds", () => {
        const sw = cubeMineSweeper(5, 22);
        for (let i = 0; i < 50; i++) {
            const cube = sw.emptyCube();
            sw.generateBoardInPlace(cube, { face: "T", r: 2, c: 2 });
            expect(cube.T[2][2].isMine).toBe(false);
        }
    });

    test("same seed (replay=true) produces identical mine layout", () => {
        const sw = cubeMineSweeper(5, 22);
        const a = sw.emptyCube();
        const b = sw.emptyCube();
        sw.generateBoardInPlace(a, { face: "F", r: 0, c: 0 }, "deadbeef-1");
        sw.generateBoardInPlace(b, { face: "F", r: 0, c: 0 }, "deadbeef-1", true);
        for (const f of FACES) {
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    expect(b[f][r][c].isMine).toBe(a[f][r][c].isMine);
                }
            }
        }
    });

    test("seed iteration bumps each non-replay call (same base → same layout, label changes)", () => {
        const sw = cubeMineSweeper(5, 22);
        const a = sw.emptyCube();
        const b = sw.emptyCube();
        // Iteration only labels re-rolls of the same conceptual seed; the actual layout is keyed
        // off the base seed (text before "-"), matching the flat minesweeper-core behavior.
        const seedA = sw.generateBoardInPlace(a, { face: "F", r: 0, c: 0 }, "deadbeef-1");
        expect(seedA).toBe("deadbeef-2");
        const seedB = sw.generateBoardInPlace(b, { face: "F", r: 0, c: 0 }, seedA);
        expect(seedB).toBe("deadbeef-3");
        for (const f of FACES) {
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    expect(b[f][r][c].isMine).toBe(a[f][r][c].isMine);
                }
            }
        }
    });

    test("adjacency counts match recomputation from mine layout", () => {
        const sw = cubeMineSweeper(5, 22);
        const cube = sw.emptyCube();
        sw.generateBoardInPlace(cube, { face: "F", r: 2, c: 2 });
        forEachCell(cube, (cell, pos) => {
            if (cell.isMine) return;
            let expected = 0;
            for (const n of getNeighbors(pos.face, pos.r, pos.c, 5)) {
                if (cube[n.face][n.r][n.c].isMine) expected++;
            }
            expect(cell.adjacentMines, `${pos.face}:${pos.r},${pos.c}`).toBe(expected);
        });
    });
});

describe("revealCellInPlace", () => {
    test("revealing a single non-zero cell reveals only that cell", () => {
        const sw = cubeMineSweeper(3, 0);
        const cube = sw.emptyCube();
        // Manual mine placement to control adjacency.
        cube.F[0][0].isMine = true;
        // Recompute adjacency.
        forEachCell(cube, (cell, pos) => {
            if (cell.isMine) return;
            let count = 0;
            for (const n of getNeighbors(pos.face, pos.r, pos.c, 3)) {
                if (cube[n.face][n.r][n.c].isMine) count++;
            }
            cell.adjacentMines = count;
        });
        // F (0, 1) has F(0,0) as a mine neighbor → adjacentMines >= 1, no flood.
        const revealed = sw.revealCellInPlace(cube, { face: "F", r: 0, c: 1 });
        expect(revealed).toBe(1);
        expect(cube.F[0][1].isRevealed).toBe(true);
    });

    test("flood from a zero cell crosses face boundaries", () => {
        // No mines anywhere → revealing any cell floods the entire cube.
        const sw = cubeMineSweeper(5, 0);
        const cube = sw.emptyCube();
        // Recompute adjacency (all zeros).
        forEachCell(cube, (cell) => { cell.adjacentMines = 0; });
        const revealed = sw.revealCellInPlace(cube, { face: "F", r: 2, c: 2 });
        expect(revealed).toBe(6 * 5 * 5);
        forEachCell(cube, (cell) => { expect(cell.isRevealed).toBe(true); });
    });

    test("does not reveal flagged cells", () => {
        const sw = cubeMineSweeper(5, 0);
        const cube = sw.emptyCube();
        cube.F[0][0].isFlagged = true;
        const revealed = sw.revealCellInPlace(cube, { face: "F", r: 0, c: 0 });
        expect(revealed).toBe(0);
        expect(cube.F[0][0].isRevealed).toBe(false);
    });
});

describe("revealAroundInPlace (chord)", () => {
    test("safe chord reveals all unflagged neighbors", () => {
        const sw = cubeMineSweeper(5, 0);
        const cube = sw.emptyCube();
        const center: CubePosition = { face: "F", r: 2, c: 2 };
        cube.F[2][2].isRevealed = true;
        const result = sw.revealAroundInPlace(cube, center);
        // 8 neighbors, all interior to F, no mines, all flooding.
        // First reveal triggers full flood since adjacentMines = 0; total revealed equals 6*25 - 1 (already revealed center).
        expect(result.minePos).toBeUndefined();
        expect(result.count).toBe(6 * 25 - 1);
    });

    test("hitting a mine via chord still records safe reveals (regression: don't discard them)", () => {
        // Layout designed so chord neighbors have non-zero adjacentMines (no flood) and one of them is a mine.
        // Mines arranged in a "fence" so safe neighbors all border at least one mine but aren't themselves mines.
        const sw = cubeMineSweeper(5, 0);
        const cube = sw.emptyCube();
        const minePositions = [
            { face: "F" as const, r: 1, c: 2 }, // the chord-hit mine (a neighbor of F(2,2))
            { face: "F" as const, r: 0, c: 0 }, // far enough to not affect the chord's safe neighbors directly
            { face: "F" as const, r: 1, c: 4 }, // bumps F(2,3), F(2,4) counts
            { face: "F" as const, r: 4, c: 1 }, // bumps F(3,1), F(3,2)
            { face: "F" as const, r: 3, c: 4 }, // bumps F(2,3), F(3,3)
        ];
        for (const m of minePositions) cube[m.face][m.r][m.c].isMine = true;
        forEachCell(cube, (cell, pos) => {
            if (cell.isMine) return;
            let count = 0;
            for (const n of getNeighbors(pos.face, pos.r, pos.c, 5)) {
                if (cube[n.face][n.r][n.c].isMine) count++;
            }
            cell.adjacentMines = count;
        });
        cube.F[2][2].isRevealed = true;
        const result = sw.revealAroundInPlace(cube, { face: "F", r: 2, c: 2 });
        expect(result.minePos).toEqual({ face: "F", r: 1, c: 2 });
        // Safe reveals must still happen even though a mine was hit.
        expect(result.count).toBeGreaterThan(0);
        // Verify a specific safe neighbor was revealed (regression: it was wiped out before).
        expect(cube.F[3][2].isRevealed).toBe(true);
        // Mine display: hitting a chord-mine reveals all mines for the lose UI.
        for (const m of minePositions) {
            expect(cube[m.face][m.r][m.c].isRevealed).toBe(true);
        }
    });
});

describe("toggleFlagInPlace", () => {
    test("toggles flag and rejects revealed cells", () => {
        const sw = cubeMineSweeper(5, 0);
        const cube = sw.emptyCube();
        const pos: CubePosition = { face: "B", r: 1, c: 1 };
        expect(sw.toggleFlagInPlace(cube, pos)).toBe(true);
        expect(cube.B[1][1].isFlagged).toBe(true);
        expect(sw.toggleFlagInPlace(cube, pos)).toBe(true);
        expect(cube.B[1][1].isFlagged).toBe(false);
        cube.B[1][1].isRevealed = true;
        expect(sw.toggleFlagInPlace(cube, pos)).toBe(false);
    });
});

describe("isWin", () => {
    test("true iff all non-mine cells are revealed", () => {
        const sw = cubeMineSweeper(3, 0);
        const cube = sw.emptyCube();
        cube.F[0][0].isMine = true;
        expect(sw.isWin(cube)).toBe(false);
        forEachCell(cube, (cell) => { if (!cell.isMine) cell.isRevealed = true; });
        expect(sw.isWin(cube)).toBe(true);
        expect(cube.F[0][0].isRevealed).toBe(false); // mine still hidden — that's fine
    });
});

describe("difficulty presets", () => {
    test("easy is 5x5x6 with 22 mines", () => {
        const sw = easyCubeSweeper();
        expect(sw.N).toBe(5);
        expect(sw.mines).toBe(22);
    });
    test("medium is 7x7x6 with 47 mines", () => {
        const sw = mediumCubeSweeper();
        expect(sw.N).toBe(7);
        expect(sw.mines).toBe(47);
    });
    test("hard is 9x9x6 with 97 mines", () => {
        const sw = hardCubeSweeper();
        expect(sw.N).toBe(9);
        expect(sw.mines).toBe(97);
    });
});
