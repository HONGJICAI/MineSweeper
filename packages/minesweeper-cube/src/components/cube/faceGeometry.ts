import type { Face } from "@caiji-games/minesweeper-cube-core";

// Per-face placement: where the face group sits and how it's rotated so that the group's local
// +X axis aligns with our (c-increasing) "u" direction and local +Y axis aligns with -v
// (PlaneGeometry's "up" is +Y, but our (r-increasing) "v" points "downward" on the face image).
//
// Cube spans -1..+1 along each axis. Each face is placed at ±1 along its normal.
//
// Verified by hand against the corner-mapping in cubeTopology.ts: cell (r, c) on face f,
// computed as local position (cx, cy, 0) inside the rotated group, lands at the same world
// coordinate as the analytical cell-center derivation.
export const FACE_PLACEMENT: Record<Face, { position: [number, number, number]; rotation: [number, number, number] }> = {
    F: { position: [0, 0, 1],  rotation: [0, 0, 0] },
    B: { position: [0, 0, -1], rotation: [0, Math.PI, 0] },
    R: { position: [1, 0, 0],  rotation: [0, Math.PI / 2, 0] },
    L: { position: [-1, 0, 0], rotation: [0, -Math.PI / 2, 0] },
    T: { position: [0, 1, 0],  rotation: [-Math.PI / 2, 0, 0] },
    D: { position: [0, -1, 0], rotation: [Math.PI / 2, 0, 0] },
};

// In a face's local frame, cell (r, c) sits at:
//   cx = (c - (N-1)/2) * cellSize
//   cy = -(r - (N-1)/2) * cellSize  (negated because PlaneGeometry's +Y is "up" but r grows downward)
export function cellLocalPosition(r: number, c: number, N: number): [number, number] {
    const cellSize = 2 / N;
    const cx = (c - (N - 1) / 2) * cellSize;
    const cy = -(r - (N - 1) / 2) * cellSize;
    return [cx, cy];
}

export function cellSize(N: number): number {
    return 2 / N;
}
