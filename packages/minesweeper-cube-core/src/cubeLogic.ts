import { createEmptyCube, forEachCell, getNeighbors } from "./cubeTopology";
import { FACES, type Cube, type CubePosition, type Difficulty, type Face } from "./types";

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

export type ChordResult = {
    count: number;
    minePos?: CubePosition;
};

export function cubeMineSweeper(N: number, MINES: number) {
    function emptyCube(): Cube {
        return createEmptyCube(N);
    }

    // Mutates `cube` in place: places mines avoiding the safe cell, then computes adjacency counts.
    // Same seed format as the flat-board core: "<random>-<iteration>". `replay=true` keeps the iteration
    // intact so a recorded game replays identically.
    function generateBoardInPlace(
        cube: Cube,
        safe: CubePosition,
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

        let placed = 0;
        while (placed < MINES) {
            const fIdx = rng.nextInt(FACES.length);
            const r = rng.nextInt(N);
            const c = rng.nextInt(N);
            const face = FACES[fIdx];
            if (face === safe.face && r === safe.r && c === safe.c) continue;
            if (cube[face][r][c].isMine) continue;
            cube[face][r][c].isMine = true;
            placed++;
        }

        forEachCell(cube, (cell, pos) => {
            if (cell.isMine) return;
            let count = 0;
            for (const n of getNeighbors(pos.face, pos.r, pos.c, N)) {
                if (cube[n.face][n.r][n.c].isMine) count++;
            }
            cell.adjacentMines = count;
        });

        return seedStr;
    }

    // Mutates `cube` in place: flood-fills from (face, r, c). Flood crosses face edges naturally because
    // getNeighbors does. Returns count of cells revealed; 0 if start cell is already revealed/flagged.
    function revealCellInPlace(cube: Cube, pos: CubePosition): number {
        const start = cube[pos.face][pos.r][pos.c];
        if (start.isRevealed || start.isFlagged) return 0;

        const stack: CubePosition[] = [pos];
        let revealed = 0;

        while (stack.length) {
            const cur = stack.pop()!;
            const cell = cube[cur.face][cur.r][cur.c];
            if (cell.isRevealed || cell.isFlagged) continue;
            cell.isRevealed = true;
            revealed++;
            if (cell.adjacentMines === 0 && !cell.isMine) {
                for (const n of getNeighbors(cur.face, cur.r, cur.c, N)) {
                    const nb = cube[n.face][n.r][n.c];
                    if (!nb.isRevealed && !nb.isFlagged) stack.push(n);
                }
            }
        }
        return revealed;
    }

    function countFlaggedAround(cube: Cube, pos: CubePosition): number {
        let count = 0;
        for (const n of getNeighbors(pos.face, pos.r, pos.c, N)) {
            if (cube[n.face][n.r][n.c].isFlagged) count++;
        }
        return count;
    }

    // Mutates `cube` in place: chord-reveals neighbors of (pos). If a neighbor mine is hit, also
    // reveals all mines (used by the UI to show the lose-state). Safe reveals are kept even when a
    // mine is also hit, matching the behavior of the flat core.
    function revealAroundInPlace(cube: Cube, pos: CubePosition): ChordResult {
        let count = 0;
        let minePos: CubePosition | undefined;
        for (const n of getNeighbors(pos.face, pos.r, pos.c, N)) {
            const nb = cube[n.face][n.r][n.c];
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

    function revealAllMinesInPlace(cube: Cube): void {
        forEachCell(cube, (cell) => {
            if (cell.isMine && !cell.isRevealed) cell.isRevealed = true;
        });
    }

    function toggleFlagInPlace(cube: Cube, pos: CubePosition): boolean {
        const cell = cube[pos.face][pos.r][pos.c];
        if (cell.isRevealed) return false;
        cell.isFlagged = !cell.isFlagged;
        return true;
    }

    // Win = every non-mine cell is revealed. Cheaper to compute via running counters in the state
    // layer, but this is the simple authoritative check.
    function isWin(cube: Cube): boolean {
        let won = true;
        forEachCell(cube, (cell) => {
            if (!cell.isMine && !cell.isRevealed) won = false;
        });
        return won;
    }

    return {
        N,
        mines: MINES,
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

export type CubeSweeper = ReturnType<typeof cubeMineSweeper>;

// Difficulty presets. Cell counts vs flat 2D minesweeper:
//   easy   5x5x6 = 150 cells, ~15% mines → 22  (flat easy:   81, 10 mines = 12%)
//   medium 7x7x6 = 294 cells, ~16% mines → 47  (flat medium: 256, 40 mines = 16%)
//   hard   9x9x6 = 486 cells, ~20% mines → 97  (flat hard:   480, 99 mines = 21%)
// Density on cube is bumped slightly because edge/corner cells span multiple faces, which is
// visually harder to reason about.
export function easyCubeSweeper(): CubeSweeper {
    return cubeMineSweeper(5, 22);
}

export function mediumCubeSweeper(): CubeSweeper {
    return cubeMineSweeper(7, 47);
}

export function hardCubeSweeper(): CubeSweeper {
    return cubeMineSweeper(9, 97);
}

export function sweeperForDifficulty(d: Difficulty): CubeSweeper {
    switch (d) {
        case "easy": return easyCubeSweeper();
        case "medium": return mediumCubeSweeper();
        case "hard": return hardCubeSweeper();
    }
}
