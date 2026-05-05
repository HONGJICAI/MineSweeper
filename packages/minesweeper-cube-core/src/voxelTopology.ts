import type { CubeCell } from "./types";

// Volumetric (Rubik's-cube-style) cube minesweeper. Each cell is a 3D voxel addressed by
// (x, y, z) ∈ [0, N-1]³. Only "surface" voxels — those with at least one coord at 0 or N-1 —
// are interactive; interior voxels are tracked too but stay empty unless the layered/inner-
// influence mode is enabled later.
//
// A surface voxel's adjacency is the 3D Moore neighborhood (up to 26 cells in bounds), filtered
// to surface voxels only. Compared to the hollow face-based model:
//   * Face-center voxels: 8 neighbors (same as before)
//   * Edge voxels: 8 neighbors (same as before)
//   * Corner voxels: 6 neighbors (was 7 in face model — one fewer because the diagonal across
//     the cube interior is filtered out)

export type VoxelPos = { x: number; y: number; z: number };
export type VoxelCube = CubeCell[][][];

// True iff the voxel at (x, y, z) is on the cube's outer surface.
export function isSurface(x: number, y: number, z: number, N: number): boolean {
    return x === 0 || x === N - 1 || y === 0 || y === N - 1 || z === 0 || z === N - 1;
}

// Sparse cell allocation: only surface voxels get a real CubeCell. Interior slots are stored as
// `null` (cast through `unknown` to fit the dense type). This is safe because every caller —
// generation, flood fill, win check, rendering — only ever accesses surface positions (filtered
// by `isSurface` or visited via `forEachSurfaceVoxel`). Saves ~46% cell objects at N=15 and
// ~21% at N=5; useful at higher levels and harmless at low ones.
export function createEmptyVoxelCube(N: number): VoxelCube {
    return Array.from({ length: N }, (_, x) =>
        Array.from({ length: N }, (_, y) =>
            Array.from({ length: N }, (_, z) =>
                isSurface(x, y, z, N)
                    ? { isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0 }
                    : (null as unknown as CubeCell)
            )
        )
    );
}

// 26-Moore neighbors of (x, y, z), filtered to in-bounds AND surface. The interior diagonal
// neighbor is excluded because it can never hold a (surface-only) mine and the player would
// never see it anyway.
export function getSurfaceVoxelNeighbors(x: number, y: number, z: number, N: number): VoxelPos[] {
    const result: VoxelPos[] = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dy === 0 && dz === 0) continue;
                const nx = x + dx, ny = y + dy, nz = z + dz;
                if (nx < 0 || nx >= N || ny < 0 || ny >= N || nz < 0 || nz >= N) continue;
                if (!isSurface(nx, ny, nz, N)) continue;
                result.push({ x: nx, y: ny, z: nz });
            }
        }
    }
    return result;
}

// Iterates surface voxels in row-major (x, y, z) order.
export function forEachSurfaceVoxel(
    cube: VoxelCube,
    fn: (cell: CubeCell, pos: VoxelPos) => void,
): void {
    const N = cube.length;
    for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
            for (let z = 0; z < N; z++) {
                if (!isSurface(x, y, z, N)) continue;
                fn(cube[x][y][z], { x, y, z });
            }
        }
    }
}

// Count of surface voxels in an NxNxN cube: outer total minus interior (N-2)³.
// Closed form: N=1 → 1; N=2 → 8 (every cell is surface); else N³ − (N−2)³ = 6N² − 12N + 8.
export function surfaceCount(N: number): number {
    if (N <= 0) return 0;
    if (N === 1) return 1;
    if (N === 2) return 8;
    return N * N * N - (N - 2) * (N - 2) * (N - 2);
}
