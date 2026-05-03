import { FACES, type Cube, type CubeCell, type CubePosition, type Face } from "./types";

// Cube layout convention.
//
// Each face is an NxN grid with r=0 at the top edge of the face (when viewed from outside) and
// c=0 at the left edge. Faces are placed in 3D so that, when "unfolded" into a cross, the layout is:
//
//                +---+
//                | T |
//        +---+---+---+---+
//        | L | F | R | B |
//        +---+---+---+---+
//                | D |
//                +---+
//
// where adjacent faces in this cross share their edges directly (no flip). The four edges that are
// NOT in the cross (T-B, T-L, T-R, D-B, D-L, D-R wraparounds) require coordinate reversal — that's
// why the crossing table below has both same-direction and reversed mappings.
//
// Cell-corner observations:
//   * Interior cells: 8 neighbors (standard 2D Moore neighborhood).
//   * Edge cells (on a face edge but not at a cube corner): 8 neighbors (5 within face + 3 across edge).
//   * Corner cells (at one of the 8 cube corners): 7 neighbors. The "diagonal" position that would be
//     out of bounds in BOTH row and column corresponds to the cube corner itself, which has no fourth
//     cell — three cells (one per face meeting at that corner) are mutual neighbors via cube-corner
//     contact, not four.

type EdgeKind = "top" | "right" | "bottom" | "left";

// Maps an index along one face's edge to the corresponding cell on the neighboring face.
// `idx` runs 0..N-1 along the edge; the convention for which direction is documented per edge below.
//
// Edge index conventions (matches the row/col of the cell whose edge lies on the boundary):
//   top    edge: idx = c    (cell is at (0, idx))
//   right  edge: idx = r    (cell is at (idx, N-1))
//   bottom edge: idx = c    (cell is at (N-1, idx))
//   left   edge: idx = r    (cell is at (idx, 0))
type Crossing = { face: Face; map: (idx: number, N: number) => { r: number; c: number } };

// Hand-derived from 3D cube-corner positions; verified by the symmetry test.
const CROSSINGS: Record<Face, Record<EdgeKind, Crossing>> = {
    F: {
        top:    { face: "T", map: (i, N) => ({ r: N - 1, c: i }) },
        right:  { face: "R", map: (i)    => ({ r: i,     c: 0 }) },
        bottom: { face: "D", map: (i)    => ({ r: 0,     c: i }) },
        left:   { face: "L", map: (i, N) => ({ r: i,     c: N - 1 }) },
    },
    R: {
        top:    { face: "T", map: (i, N) => ({ r: N - 1 - i, c: N - 1 }) },
        right:  { face: "B", map: (i)    => ({ r: i,         c: 0 }) },
        bottom: { face: "D", map: (i, N) => ({ r: i,         c: N - 1 }) },
        left:   { face: "F", map: (i, N) => ({ r: i,         c: N - 1 }) },
    },
    L: {
        top:    { face: "T", map: (i)    => ({ r: i,         c: 0 }) },
        right:  { face: "F", map: (i)    => ({ r: i,         c: 0 }) },
        bottom: { face: "D", map: (i, N) => ({ r: N - 1 - i, c: 0 }) },
        left:   { face: "B", map: (i, N) => ({ r: i,         c: N - 1 }) },
    },
    B: {
        top:    { face: "T", map: (i, N) => ({ r: 0,     c: N - 1 - i }) },
        right:  { face: "L", map: (i)    => ({ r: i,     c: 0 }) },
        bottom: { face: "D", map: (i, N) => ({ r: N - 1, c: N - 1 - i }) },
        left:   { face: "R", map: (i, N) => ({ r: i,     c: N - 1 }) },
    },
    T: {
        top:    { face: "B", map: (i, N) => ({ r: 0,         c: N - 1 - i }) },
        right:  { face: "R", map: (i, N) => ({ r: 0,         c: N - 1 - i }) },
        bottom: { face: "F", map: (i)    => ({ r: 0,         c: i }) },
        left:   { face: "L", map: (i)    => ({ r: 0,         c: i }) },
    },
    D: {
        top:    { face: "F", map: (i, N) => ({ r: N - 1,     c: i }) },
        right:  { face: "R", map: (i, N) => ({ r: N - 1,     c: i }) },
        bottom: { face: "B", map: (i, N) => ({ r: N - 1,     c: N - 1 - i }) },
        left:   { face: "L", map: (i, N) => ({ r: N - 1,     c: N - 1 - i }) },
    },
};

const OFFSETS: ReadonlyArray<readonly [number, number]> = [
    [-1, -1], [-1, 0], [-1, 1],
    [ 0, -1],          [ 0, 1],
    [ 1, -1], [ 1, 0], [ 1, 1],
];

// Returns all neighbors of (face, r, c) on the cube surface. Length is 7 at cube-corner cells, 8 elsewhere.
// The 8th candidate (diagonal off both edges) at a cube corner is dropped, since the cube corner is a
// 3-way meeting point with no fourth cell.
export function getNeighbors(face: Face, r: number, c: number, N: number): CubePosition[] {
    const result: CubePosition[] = [];
    for (const [dr, dc] of OFFSETS) {
        const nr = r + dr;
        const nc = c + dc;
        const outR = nr < 0 || nr >= N;
        const outC = nc < 0 || nc >= N;
        if (!outR && !outC) {
            result.push({ face, r: nr, c: nc });
            continue;
        }
        if (outR && outC) continue; // cube corner: no diagonal neighbor exists
        const edge: EdgeKind = outR ? (nr < 0 ? "top" : "bottom") : (nc < 0 ? "left" : "right");
        // Index along the edge is whichever coord stayed in bounds.
        const idx = outR ? nc : nr;
        const crossing = CROSSINGS[face][edge];
        const mapped = crossing.map(idx, N);
        result.push({ face: crossing.face, r: mapped.r, c: mapped.c });
    }
    return result;
}

export function createEmptyCube(N: number): Cube {
    const make = (): CubeCell[][] =>
        Array.from({ length: N }, () =>
            Array.from({ length: N }, () => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                adjacentMines: 0,
            }))
        );
    return { F: make(), B: make(), L: make(), R: make(), T: make(), D: make() };
}

export function totalCells(N: number): number {
    return 6 * N * N;
}

export function forEachCell(cube: Cube, fn: (cell: CubeCell, pos: CubePosition) => void): void {
    for (const face of FACES) {
        const grid = cube[face];
        const N = grid.length;
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                fn(grid[r][c], { face, r, c });
            }
        }
    }
}
