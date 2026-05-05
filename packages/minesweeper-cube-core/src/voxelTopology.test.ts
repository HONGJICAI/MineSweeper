import { describe, test, expect } from "vitest";
import {
    createEmptyVoxelCube,
    getSurfaceVoxelNeighbors,
    isSurface,
    surfaceCount,
    type VoxelPos,
} from "./voxelTopology";

function key(p: VoxelPos): string {
    return `${p.x},${p.y},${p.z}`;
}

describe("isSurface", () => {
    test("any coord at boundary marks the voxel as surface", () => {
        expect(isSurface(0, 1, 1, 5)).toBe(true);
        expect(isSurface(4, 1, 1, 5)).toBe(true);
        expect(isSurface(1, 0, 1, 5)).toBe(true);
        expect(isSurface(1, 4, 1, 5)).toBe(true);
        expect(isSurface(1, 1, 0, 5)).toBe(true);
        expect(isSurface(1, 1, 4, 5)).toBe(true);
    });

    test("strictly interior voxels are not surface", () => {
        expect(isSurface(1, 1, 1, 5)).toBe(false);
        expect(isSurface(2, 2, 2, 5)).toBe(false);
        expect(isSurface(3, 3, 3, 5)).toBe(false);
    });

    test("for N=2 every voxel is surface", () => {
        for (let x = 0; x < 2; x++)
            for (let y = 0; y < 2; y++)
                for (let z = 0; z < 2; z++)
                    expect(isSurface(x, y, z, 2)).toBe(true);
    });
});

describe("getSurfaceVoxelNeighbors", () => {
    test("face-center voxel has 8 neighbors, all on the same face", () => {
        const N = 5;
        const ns = getSurfaceVoxelNeighbors(2, 2, 0, N);
        expect(ns).toHaveLength(8);
        // All neighbors should be on z=0 face (since the interior neighbor at z=1 is filtered).
        expect(ns.every(n => n.z === 0)).toBe(true);
    });

    test("edge voxel (not at corner) has 8 neighbors across two faces", () => {
        const N = 5;
        // (2, 0, 0) is on the y=0 / z=0 edge, midway along x.
        const ns = getSurfaceVoxelNeighbors(2, 0, 0, N);
        expect(ns).toHaveLength(8);
        // 3 along the same edge (x=1,3 at y=0,z=0... wait only 2 same-edge), 3 on y=0 face
        // (z=1), 3 on z=0 face (y=1). Just check all are surface.
        expect(ns.every(n => isSurface(n.x, n.y, n.z, N))).toBe(true);
    });

    test("corner voxel has 6 neighbors (interior diagonal excluded)", () => {
        const N = 5;
        const ns = getSurfaceVoxelNeighbors(0, 0, 0, N);
        expect(ns).toHaveLength(6);
        // Specifically: (1,0,0), (0,1,0), (0,0,1), (1,1,0), (1,0,1), (0,1,1).
        // Not present: (1,1,1) — interior of cube.
        const got = new Set(ns.map(key));
        expect(got.has("1,1,1")).toBe(false);
    });

    test("all 8 cube-corner voxels have exactly 6 neighbors", () => {
        const N = 5;
        const corners: VoxelPos[] = [];
        for (const x of [0, N - 1]) for (const y of [0, N - 1]) for (const z of [0, N - 1]) {
            corners.push({ x, y, z });
        }
        for (const c of corners) {
            const ns = getSurfaceVoxelNeighbors(c.x, c.y, c.z, N);
            expect(ns).toHaveLength(6);
        }
    });

    test("symmetry: A is neighbor of B iff B is neighbor of A", () => {
        const N = 4;
        for (let x = 0; x < N; x++)
            for (let y = 0; y < N; y++)
                for (let z = 0; z < N; z++) {
                    if (!isSurface(x, y, z, N)) continue;
                    const ns = getSurfaceVoxelNeighbors(x, y, z, N);
                    for (const b of ns) {
                        const back = getSurfaceVoxelNeighbors(b.x, b.y, b.z, N);
                        const found = back.some(p => p.x === x && p.y === y && p.z === z);
                        expect(found, `(${x},${y},${z}) → (${b.x},${b.y},${b.z}) but reverse missing`).toBe(true);
                    }
                }
    });

    test("no neighbor list contains the voxel itself", () => {
        const N = 5;
        for (let x = 0; x < N; x++)
            for (let y = 0; y < N; y++)
                for (let z = 0; z < N; z++) {
                    if (!isSurface(x, y, z, N)) continue;
                    const ns = getSurfaceVoxelNeighbors(x, y, z, N);
                    expect(ns.some(p => p.x === x && p.y === y && p.z === z)).toBe(false);
                }
    });
});

describe("surfaceCount", () => {
    test.each([
        [1, 1],
        [2, 8],
        [3, 26],   // 27 - 1
        [4, 56],   // 64 - 8
        [5, 98],   // 125 - 27
        [7, 218],  // 343 - 125
        [9, 386],  // 729 - 343
    ])("N=%i has %i surface voxels", (N, expected) => {
        expect(surfaceCount(N)).toBe(expected);
    });
});

describe("createEmptyVoxelCube", () => {
    test("creates an N×N×N grid with surface cells blank, interior cells unallocated", () => {
        const N = 4;
        const cube = createEmptyVoxelCube(N);
        expect(cube).toHaveLength(N);
        expect(cube[0]).toHaveLength(N);
        expect(cube[0][0]).toHaveLength(N);
        for (let x = 0; x < N; x++)
            for (let y = 0; y < N; y++)
                for (let z = 0; z < N; z++) {
                    const c = cube[x][y][z];
                    if (isSurface(x, y, z, N)) {
                        // Surface cells are real CubeCell objects, all properties default.
                        expect(c).not.toBeNull();
                        expect(c.isMine).toBe(false);
                        expect(c.isRevealed).toBe(false);
                        expect(c.isFlagged).toBe(false);
                        expect(c.adjacentMines).toBe(0);
                    } else {
                        // Interior cells are sparse — never accessed by the game logic.
                        expect(c).toBeNull();
                    }
                }
    });
});
