import {
    GameStatus,
    sweeperForDifficulty,
    type Cube,
    type CubePosition,
    type CubeSweeper,
    type Difficulty,
} from "@caiji-games/minesweeper-cube-core";

export function createGameState(initial: Difficulty = "easy") {
    const initialSweeper = sweeperForDifficulty(initial);
    let difficulty = $state<Difficulty>(initial);
    // Sweeper bundles the pure logic; recreated on difficulty change.
    let sweeper: CubeSweeper = $state.raw(initialSweeper);
    let cube = $state<Cube>(initialSweeper.emptyCube());
    let status = $state<GameStatus>(GameStatus.Init);
    let seed = $state<string>("");
    let flagsPlaced = $state<number>(0);
    // The mine the player actually stepped on (vs. mines auto-revealed alongside it).
    // Mirrors the 2D core's `lastStepOnMine` state — used to highlight that one cell red.
    let lastStep = $state<CubePosition | null>(null);

    function reset() {
        cube = sweeper.emptyCube();
        status = GameStatus.Init;
        seed = "";
        flagsPlaced = 0;
        lastStep = null;
    }

    function setDifficulty(d: Difficulty) {
        if (d === difficulty) return;
        difficulty = d;
        sweeper = sweeperForDifficulty(d);
        reset();
    }

    function reveal(pos: CubePosition): void {
        if (status === GameStatus.GameOver || status === GameStatus.Win) return;
        if (status === GameStatus.Init) {
            seed = sweeper.generateBoardInPlace(cube, pos, seed);
            status = GameStatus.Gaming;
        }
        const cell = cube[pos.face][pos.r][pos.c];
        if (cell.isFlagged || cell.isRevealed) return;
        if (cell.isMine) {
            cell.isRevealed = true;
            sweeper.revealAllMinesInPlace(cube);
            lastStep = pos;
            status = GameStatus.GameOver;
            return;
        }
        sweeper.revealCellInPlace(cube, pos);
        if (sweeper.isWin(cube)) status = GameStatus.Win;
    }

    function toggleFlag(pos: CubePosition): void {
        // Only allowed during active play. In Init the board hasn't been generated yet, so
        // flagging is meaningless (and confusing on touch where Flag mode might be on).
        if (status !== GameStatus.Gaming) return;
        const cell = cube[pos.face][pos.r][pos.c];
        if (cell.isRevealed) return;
        const before = cell.isFlagged;
        if (sweeper.toggleFlagInPlace(cube, pos)) {
            flagsPlaced += before ? -1 : 1;
        }
    }

    function chord(pos: CubePosition): void {
        if (status !== GameStatus.Gaming) return;
        const cell = cube[pos.face][pos.r][pos.c];
        if (!cell.isRevealed || cell.adjacentMines === 0) return;
        if (sweeper.countFlaggedAround(cube, pos) !== cell.adjacentMines) return;
        const result = sweeper.revealAroundInPlace(cube, pos);
        if (result.minePos) {
            lastStep = result.minePos;
            status = GameStatus.GameOver;
        } else if (sweeper.isWin(cube)) {
            status = GameStatus.Win;
        }
    }

    return {
        get difficulty() { return difficulty; },
        get cube() { return cube; },
        get status() { return status; },
        get seed() { return seed; },
        get N() { return sweeper.N; },
        get totalMines() { return sweeper.mines; },
        get minesLeft() { return sweeper.mines - flagsPlaced; },
        get lastStep() { return lastStep; },
        setDifficulty,
        reset,
        reveal,
        toggleFlag,
        chord,
    };
}

export type GameState = ReturnType<typeof createGameState>;
