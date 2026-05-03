import { describe, test, expect } from "vitest";
import { createEmptyCube, getNeighbors, totalCells } from "./cubeTopology";
import { FACES, type CubePosition, type Face } from "./types";

function key(p: CubePosition): string {
    return `${p.face}:${p.r},${p.c}`;
}

function uniqueKeys(positions: CubePosition[]): Set<string> {
    return new Set(positions.map(key));
}

describe("getNeighbors", () => {
    test("interior cell has 8 distinct neighbors all on the same face", () => {
        const N = 5;
        const neighbors = getNeighbors("F", 2, 2, N);
        expect(neighbors).toHaveLength(8);
        expect(uniqueKeys(neighbors).size).toBe(8);
        expect(neighbors.every(n => n.face === "F")).toBe(true);
    });

    test("face-edge non-corner cell has 8 distinct neighbors split across two faces", () => {
        const N = 5;
        // F's top edge, middle column (not at a cube corner).
        const neighbors = getNeighbors("F", 0, 2, N);
        expect(neighbors).toHaveLength(8);
        expect(uniqueKeys(neighbors).size).toBe(8);
        const faces = new Set(neighbors.map(n => n.face));
        expect(faces).toEqual(new Set(["F", "T"]));
        // 5 within F (r=0,c-1,c+1) + (r=1,c-1,c,c+1) = 5; 3 across to T.
        expect(neighbors.filter(n => n.face === "F").length).toBe(5);
        expect(neighbors.filter(n => n.face === "T").length).toBe(3);
    });

    test("cube-corner cell has exactly 7 distinct neighbors across three faces", () => {
        const N = 5;
        // F's top-left corner: cube corner shared by F, T, L.
        const neighbors = getNeighbors("F", 0, 0, N);
        expect(neighbors).toHaveLength(7);
        expect(uniqueKeys(neighbors).size).toBe(7);
        const faces = new Set(neighbors.map(n => n.face));
        expect(faces).toEqual(new Set(["F", "T", "L"]));
    });

    test("all 24 cube-corner cells have exactly 7 neighbors at N=5", () => {
        const N = 5;
        const corners: Array<[Face, number, number]> = [];
        for (const f of FACES) {
            corners.push([f, 0, 0], [f, 0, N - 1], [f, N - 1, 0], [f, N - 1, N - 1]);
        }
        for (const [f, r, c] of corners) {
            const ns = getNeighbors(f, r, c, N);
            expect(ns).toHaveLength(7);
            expect(uniqueKeys(ns).size).toBe(7);
        }
    });

    test("symmetry: A is a neighbor of B iff B is a neighbor of A", () => {
        const N = 4;
        for (const f of FACES) {
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    const a: CubePosition = { face: f, r, c };
                    const ns = getNeighbors(f, r, c, N);
                    for (const b of ns) {
                        const back = getNeighbors(b.face, b.r, b.c, N);
                        const found = back.some(p => p.face === a.face && p.r === a.r && p.c === a.c);
                        expect(found, `${key(a)} -> ${key(b)} but reverse missing`).toBe(true);
                    }
                }
            }
        }
    });

    test("no neighbor returns the cell itself", () => {
        const N = 5;
        for (const f of FACES) {
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    const ns = getNeighbors(f, r, c, N);
                    expect(ns.some(n => n.face === f && n.r === r && n.c === c)).toBe(false);
                }
            }
        }
    });

    test("specific F-T-L corner mapping (sanity check on derivation)", () => {
        // F (0, 0) is the top-left corner of F. The cube corner there is shared with T and L.
        // Expected 7 neighbors per cross-face derivation:
        //   F (0, 1), F (1, 0), F (1, 1)            ← within F
        //   T (N-1, 0), T (N-1, 1)                  ← across F's top edge
        //   L (0, N-1), L (1, N-1)                  ← across F's left edge
        const N = 5;
        const expected = new Set<string>([
            "F:0,1", "F:1,0", "F:1,1",
            "T:4,0", "T:4,1",
            "L:0,4", "L:1,4",
        ]);
        const got = uniqueKeys(getNeighbors("F", 0, 0, N));
        expect(got).toEqual(expected);
    });

    test("specific F-T-R corner mapping", () => {
        // F (0, N-1) cube corner is shared by F, T, R.
        const N = 5;
        const expected = new Set<string>([
            "F:0,3", "F:1,3", "F:1,4",
            "T:4,3", "T:4,4",
            "R:0,0", "R:1,0",
        ]);
        const got = uniqueKeys(getNeighbors("F", 0, 4, N));
        expect(got).toEqual(expected);
    });

    test("global neighbor count matches expected formula", () => {
        // Expected total directed adjacencies:
        //   8 cube corners × 3 cells per corner × 7 neighbors each = 168
        //   12 cube edges × 2 faces × (N-2) cells × 8 neighbors each = 192(N-2)
        //   6 faces × (N-2)^2 interior × 8 = 48(N-2)^2
        // For N=5: 168 + 192*3 + 48*9 = 168 + 576 + 432 = 1176.
        const N = 5;
        let total = 0;
        for (const f of FACES) {
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    total += getNeighbors(f, r, c, N).length;
                }
            }
        }
        expect(total).toBe(1176);
        // Adjacency is symmetric, so total directed count must be even.
        expect(total % 2).toBe(0);
    });

    test("works at minimum useful size N=2 (every cell is a cube-corner cell)", () => {
        const N = 2;
        for (const f of FACES) {
            for (let r = 0; r < N; r++) {
                for (let c = 0; c < N; c++) {
                    const ns = getNeighbors(f, r, c, N);
                    expect(ns).toHaveLength(7);
                    expect(uniqueKeys(ns).size).toBe(7);
                }
            }
        }
    });
});

describe("createEmptyCube", () => {
    test("creates 6 NxN grids with all cells blank", () => {
        const N = 5;
        const cube = createEmptyCube(N);
        for (const f of FACES) {
            expect(cube[f]).toHaveLength(N);
            for (const row of cube[f]) {
                expect(row).toHaveLength(N);
                for (const cell of row) {
                    expect(cell.isMine).toBe(false);
                    expect(cell.isRevealed).toBe(false);
                    expect(cell.isFlagged).toBe(false);
                    expect(cell.adjacentMines).toBe(0);
                }
            }
        }
    });

    test("rows are independent arrays", () => {
        const cube = createEmptyCube(3);
        expect(cube.F[0]).not.toBe(cube.F[1]);
        expect(cube.F).not.toBe(cube.B);
    });
});

describe("totalCells", () => {
    test.each([
        [5, 150],
        [7, 294],
        [9, 486],
    ])("N=%i → %i cells", (N, expected) => {
        expect(totalCells(N)).toBe(expected);
    });
});
