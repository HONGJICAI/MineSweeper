import { describe, test, expect } from "vitest";
import {
    minesForVoxelLevel,
    voxelCubeMineSweeper,
    voxelCubeMineSweeperForLevel,
} from "./voxelLogic";
import {
    forEachSurfaceVoxel,
    getSurfaceVoxelNeighbors,
    isSurface,
    type VoxelCube,
    type VoxelPos,
} from "./voxelTopology";

function countSurfaceMines(cube: VoxelCube): number {
    let n = 0;
    forEachSurfaceVoxel(cube, (c) => { if (c.isMine) n++; });
    return n;
}

function countSurfaceRevealed(cube: VoxelCube): number {
    let n = 0;
    forEachSurfaceVoxel(cube, (c) => { if (c.isRevealed) n++; });
    return n;
}

function setMineAt(cube: VoxelCube, pos: VoxelPos, N: number) {
    cube[pos.x][pos.y][pos.z].isMine = true;
    // Recompute adjacency for surface cells.
    forEachSurfaceVoxel(cube, (cell, p) => {
        if (cell.isMine) return;
        let count = 0;
        for (const n of getSurfaceVoxelNeighbors(p.x, p.y, p.z, N)) {
            if (cube[n.x][n.y][n.z].isMine) count++;
        }
        cell.adjacentMines = count;
    });
}

describe("generateBoardInPlace (voxel)", () => {
    test("places exactly MINES mines, all on surface", () => {
        const sw = voxelCubeMineSweeper(5, 22);
        const cube = sw.emptyCube();
        sw.generateBoardInPlace(cube, { x: 0, y: 0, z: 0 });
        expect(countSurfaceMines(cube)).toBe(22);
        // Sanity: interior voxels are sparse (null), so they can't carry mines by construction.
        for (let x = 1; x < 4; x++)
            for (let y = 1; y < 4; y++)
                for (let z = 1; z < 4; z++)
                    expect(cube[x][y][z]).toBeNull();
    });

    test("safe cell is never a mine across many seeds", () => {
        const sw = voxelCubeMineSweeper(5, 22);
        for (let i = 0; i < 50; i++) {
            const cube = sw.emptyCube();
            sw.generateBoardInPlace(cube, { x: 2, y: 0, z: 2 });
            expect(cube[2][0][2].isMine).toBe(false);
        }
    });

    test("same seed (replay=true) → identical mine layout", () => {
        const sw = voxelCubeMineSweeper(5, 22);
        const a = sw.emptyCube();
        const b = sw.emptyCube();
        sw.generateBoardInPlace(a, { x: 0, y: 0, z: 0 }, "deadbeef-1");
        sw.generateBoardInPlace(b, { x: 0, y: 0, z: 0 }, "deadbeef-1", true);
        forEachSurfaceVoxel(a, (cell, pos) => {
            expect(b[pos.x][pos.y][pos.z].isMine).toBe(cell.isMine);
        });
    });

    test("adjacency counts match recomputation from mine layout", () => {
        const sw = voxelCubeMineSweeper(5, 22);
        const cube = sw.emptyCube();
        sw.generateBoardInPlace(cube, { x: 2, y: 2, z: 0 });
        forEachSurfaceVoxel(cube, (cell, pos) => {
            if (cell.isMine) return;
            let expected = 0;
            for (const n of getSurfaceVoxelNeighbors(pos.x, pos.y, pos.z, 5)) {
                if (cube[n.x][n.y][n.z].isMine) expected++;
            }
            expect(cell.adjacentMines, `(${pos.x},${pos.y},${pos.z})`).toBe(expected);
        });
    });
});

describe("revealCellInPlace (voxel)", () => {
    test("flood-fill from a zero cell with no mines reveals all surface cells", () => {
        const sw = voxelCubeMineSweeper(5, 0);
        const cube = sw.emptyCube();
        // No mines, so every surface cell has adjacentMines = 0 → flood fills the whole surface.
        const revealed = sw.revealCellInPlace(cube, { x: 0, y: 0, z: 0 });
        expect(revealed).toBe(98); // surfaceCount(5)
        forEachSurfaceVoxel(cube, (cell) => expect(cell.isRevealed).toBe(true));
    });

    test("revealing a non-zero cell reveals only that cell", () => {
        const sw = voxelCubeMineSweeper(3, 0);
        const cube = sw.emptyCube();
        setMineAt(cube, { x: 0, y: 0, z: 0 }, 3);
        // (1, 0, 0) is on a surface, has mine neighbor at corner (0,0,0) → adjacentMines >= 1.
        const revealed = sw.revealCellInPlace(cube, { x: 1, y: 0, z: 0 });
        expect(revealed).toBe(1);
        expect(cube[1][0][0].isRevealed).toBe(true);
    });

    test("does not reveal flagged cells", () => {
        const sw = voxelCubeMineSweeper(5, 0);
        const cube = sw.emptyCube();
        cube[0][0][0].isFlagged = true;
        const revealed = sw.revealCellInPlace(cube, { x: 0, y: 0, z: 0 });
        expect(revealed).toBe(0);
        expect(cube[0][0][0].isRevealed).toBe(false);
    });
});

describe("toggleFlagInPlace (voxel)", () => {
    test("toggles flag and rejects revealed cells", () => {
        const sw = voxelCubeMineSweeper(5, 0);
        const cube = sw.emptyCube();
        const pos: VoxelPos = { x: 0, y: 2, z: 2 };
        expect(sw.toggleFlagInPlace(cube, pos)).toBe(true);
        expect(cube[0][2][2].isFlagged).toBe(true);
        expect(sw.toggleFlagInPlace(cube, pos)).toBe(true);
        expect(cube[0][2][2].isFlagged).toBe(false);
        cube[0][2][2].isRevealed = true;
        expect(sw.toggleFlagInPlace(cube, pos)).toBe(false);
    });
});

describe("isWin (voxel)", () => {
    test("true iff all non-mine surface cells revealed", () => {
        const sw = voxelCubeMineSweeper(3, 0);
        const cube = sw.emptyCube();
        cube[0][0][0].isMine = true;
        expect(sw.isWin(cube)).toBe(false);
        forEachSurfaceVoxel(cube, (cell) => { if (!cell.isMine) cell.isRevealed = true; });
        expect(sw.isWin(cube)).toBe(true);
    });
});

describe("difficulty / level helpers (voxel)", () => {
    test("minesForVoxelLevel scales with N", () => {
        expect(minesForVoxelLevel(7)).toBe(35);   // round(218 * 47/294)
        expect(minesForVoxelLevel(9)).toBe(77);   // round(386 * 97/486)
    });

    test("voxelCubeMineSweeperForLevel returns a sweeper at the right N + mine count", () => {
        const sw = voxelCubeMineSweeperForLevel(7);
        expect(sw.N).toBe(7);
        expect(sw.mines).toBe(35);
        expect(sw.surfaceTotal).toBe(218);
    });
});
