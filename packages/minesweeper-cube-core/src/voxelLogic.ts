import {
    createEmptyVoxelCube,
    forEachSurfaceVoxel,
    getSurfaceVoxelNeighbors,
    isSurface,
    surfaceCount,
    type VoxelCube,
    type VoxelPos,
} from "./voxelTopology";

// Voxel-mode sweeper. Mirrors the API surface of `cubeMineSweeper` (generateBoardInPlace,
// revealCellInPlace, etc.) so the surrounding state machine in the app can stay shape-compatible.
// All cell access goes through (x, y, z) instead of (face, r, c).
//
// Mine placement is **surface-only** — interior voxels exist as data slots but stay empty.
// Future "inner influence" modes can be layered on by writing to interior voxels too; the
// adjacency function already filters to surface, so that change alone won't break flood fill.

class SeededRandom {
    private seed: number;

    constructor(seed: string) {
        this.seed = SeededRandom.stringToSeed(seed);
    }

    private static stringToSeed(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    next(): number {
        this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
        return this.seed / 0x7fffffff;
    }

    nextInt(max: number): number {
        return Math.floor(this.next() * max);
    }
}

function generateSeed(): string {
    return `${Math.random().toString(36).substring(2, 10)}-1`;
}

export type VoxelChordResult = {
    count: number;
    minePos?: VoxelPos;
};

export function voxelCubeMineSweeper(N: number, MINES: number) {
    function emptyCube(): VoxelCube {
        return createEmptyVoxelCube(N);
    }

    // Picks a uniformly random surface voxel using a precomputed list. Cheaper than rejection
    // sampling on the full N³ space when surface is a small fraction of total volume (large N).
    let surfacePositionsCache: VoxelPos[] | null = null;
    function getSurfacePositions(): VoxelPos[] {
        if (surfacePositionsCache) return surfacePositionsCache;
        const list: VoxelPos[] = [];
        for (let x = 0; x < N; x++)
            for (let y = 0; y < N; y++)
                for (let z = 0; z < N; z++)
                    if (isSurface(x, y, z, N)) list.push({ x, y, z });
        surfacePositionsCache = list;
        return list;
    }

    function generateBoardInPlace(
        cube: VoxelCube,
        safe: VoxelPos,
        seedStr = "",
        replay = false,
    ): string {
        if (seedStr === "") {
            seedStr = generateSeed();
        } else if (!replay) {
            const parts = seedStr.split("-");
            if (parts.length < 2 || isNaN(parseInt(parts[1]))) {
                seedStr = generateSeed();
            } else {
                const iteration = parseInt(parts[1]) + 1;
                seedStr = `${parts[0]}-${iteration}`;
            }
        }
        const rng = new SeededRandom(seedStr.split("-")[0]);
        const positions = getSurfacePositions();

        let placed = 0;
        while (placed < MINES) {
            const idx = rng.nextInt(positions.length);
            const p = positions[idx];
            if (p.x === safe.x && p.y === safe.y && p.z === safe.z) continue;
            if (cube[p.x][p.y][p.z].isMine) continue;
            cube[p.x][p.y][p.z].isMine = true;
            placed++;
        }

        forEachSurfaceVoxel(cube, (cell, pos) => {
            if (cell.isMine) return;
            let count = 0;
            for (const n of getSurfaceVoxelNeighbors(pos.x, pos.y, pos.z, N)) {
                if (cube[n.x][n.y][n.z].isMine) count++;
            }
            cell.adjacentMines = count;
        });

        return seedStr;
    }

    function revealCellInPlace(cube: VoxelCube, pos: VoxelPos): number {
        const start = cube[pos.x][pos.y][pos.z];
        if (start.isRevealed || start.isFlagged) return 0;

        const stack: VoxelPos[] = [pos];
        let revealed = 0;

        while (stack.length) {
            const cur = stack.pop()!;
            const cell = cube[cur.x][cur.y][cur.z];
            if (cell.isRevealed || cell.isFlagged) continue;
            cell.isRevealed = true;
            revealed++;
            if (cell.adjacentMines === 0 && !cell.isMine) {
                for (const n of getSurfaceVoxelNeighbors(cur.x, cur.y, cur.z, N)) {
                    const nb = cube[n.x][n.y][n.z];
                    if (!nb.isRevealed && !nb.isFlagged) stack.push(n);
                }
            }
        }
        return revealed;
    }

    function countFlaggedAround(cube: VoxelCube, pos: VoxelPos): number {
        let count = 0;
        for (const n of getSurfaceVoxelNeighbors(pos.x, pos.y, pos.z, N)) {
            if (cube[n.x][n.y][n.z].isFlagged) count++;
        }
        return count;
    }

    function revealAroundInPlace(cube: VoxelCube, pos: VoxelPos): VoxelChordResult {
        let count = 0;
        let minePos: VoxelPos | undefined;
        for (const n of getSurfaceVoxelNeighbors(pos.x, pos.y, pos.z, N)) {
            const nb = cube[n.x][n.y][n.z];
            if (nb.isFlagged || nb.isRevealed) continue;
            if (nb.isMine) {
                if (!minePos) minePos = n;
            } else {
                count += revealCellInPlace(cube, n);
            }
        }
        if (minePos) revealAllMinesInPlace(cube);
        return { count, minePos };
    }

    function revealAllMinesInPlace(cube: VoxelCube): void {
        forEachSurfaceVoxel(cube, (cell) => {
            if (cell.isMine && !cell.isRevealed) cell.isRevealed = true;
        });
    }

    function toggleFlagInPlace(cube: VoxelCube, pos: VoxelPos): boolean {
        const cell = cube[pos.x][pos.y][pos.z];
        if (cell.isRevealed) return false;
        cell.isFlagged = !cell.isFlagged;
        return true;
    }

    function isWin(cube: VoxelCube): boolean {
        let won = true;
        forEachSurfaceVoxel(cube, (cell) => {
            if (!cell.isMine && !cell.isRevealed) won = false;
        });
        return won;
    }

    return {
        N,
        mines: MINES,
        surfaceTotal: surfaceCount(N),
        emptyCube,
        generateBoardInPlace,
        revealCellInPlace,
        countFlaggedAround,
        revealAroundInPlace,
        revealAllMinesInPlace,
        toggleFlagInPlace,
        isWin,
    };
}

export type VoxelSweeper = ReturnType<typeof voxelCubeMineSweeper>;

// Density helpers — same step function as scaling endless, but applied over the SURFACE voxel
// count instead of 6N². This keeps gameplay difficulty roughly comparable across modes.
//   N=7 → 218 surface, ~16% → 35 mines (vs scaling endless N=7's 47 mines on 294 cells)
//   N=9 → 386 surface, ~20% → 77 mines
function densityForVoxelLevel(N: number): number {
    if (N <= 6) return 22 / 150;       // easy density (~14.67%)
    if (N <= 8) return 47 / 294;       // medium density (~15.99%)
    return 97 / 486;                    // hard density (~19.96%)
}

export function minesForVoxelLevel(N: number): number {
    return Math.round(surfaceCount(N) * densityForVoxelLevel(N));
}

export function voxelCubeMineSweeperForLevel(N: number): VoxelSweeper {
    return voxelCubeMineSweeper(N, minesForVoxelLevel(N));
}

// Voxel endless starts smaller than scaling endless: a 5×5×5 cube only has 98 surface voxels
// (vs. 6×7² = 294 face cells for scaling N=7), and at smaller N the 3D structure is easier to
// read at a glance — corners/edges are clearly distinct from face centers.
export const VOXEL_START_LEVEL = 5;
