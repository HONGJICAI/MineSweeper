import {
    cubeMineSweeperForLevel,
    ENDLESS_START_LEVEL,
    GameStatus,
    sweeperForDifficulty,
    voxelCubeMineSweeperForLevel,
    VOXEL_START_LEVEL,
    type Cube,
    type CubePosition,
    type CubeSweeper,
    type Difficulty,
    type EndlessMode,
    type Mode,
    type VoxelCube,
    type VoxelPos,
    type VoxelSweeper,
} from "@caiji-games/minesweeper-cube-core";
import { buzz } from "../lib/haptics.ts";

export type GameStateOptions = {
    // Fired at the start of an endless level-bump (synchronous with the shrink animation start).
    // Lets the UI play a celebration that overlaps with shrink → swap → grow rather than
    // popping in mid-transition. Classic-mode wins are signaled separately via status === Win.
    onEndlessClear?: () => void;
};

// Position type used by the active board. Renderer creates positions in the right shape based
// on cubeKind; methods that take positions cast internally per `kind`.
export type AnyPos = CubePosition | VoxelPos;

export function createGameState(initial: Difficulty = "easy", opts: GameStateOptions = {}) {
    const initialSweeper = sweeperForDifficulty(initial);
    let mode = $state<Mode>("classic");
    let endlessMode = $state<EndlessMode>("normal");
    let difficulty = $state<Difficulty>(initial);
    // Endless: current level (=N). Only meaningful when mode === "endless".
    let level = $state<number>(ENDLESS_START_LEVEL);
    // The active board is one of two shapes. `kind` is the discriminator for downstream branches.
    // Voxel mode (endless + voxel sub-mode) uses a 3D Rubik-style data model; everything else
    // uses the original 6-face hollow surface.
    let kind = $state<"hollow" | "voxel">("hollow");
    let sweeper: CubeSweeper | VoxelSweeper = $state.raw(initialSweeper);
    let cube = $state<Cube | VoxelCube>(initialSweeper.emptyCube());
    let status = $state<GameStatus>(GameStatus.Init);
    let seed = $state<string>("");
    let flagsPlaced = $state<number>(0);
    // The mine the player actually stepped on. Type matches `kind`.
    let lastStep = $state<AnyPos | null>(null);
    let runId = $state<number>(0);
    let runCheated = $state<boolean>(false);
    let transitionPhase = $state<"idle" | "shrinking" | "growing">("idle");
    let transitionGen = 0;
    const TRANSITION_HALF_MS = 250;

    // Sub-modes have different starting Ns: scaling endless begins at 7 (matches existing
    // gameplay), voxel endless begins at 5 (easier to read in 3D).
    function endlessStartLevel(): number {
        return endlessMode === "voxel" ? VOXEL_START_LEVEL : ENDLESS_START_LEVEL;
    }

    function makeBoard(): { kind: "hollow" | "voxel"; sweeper: CubeSweeper | VoxelSweeper } {
        if (mode === "classic") return { kind: "hollow", sweeper: sweeperForDifficulty(difficulty) };
        if (endlessMode === "voxel") return { kind: "voxel", sweeper: voxelCubeMineSweeperForLevel(level) };
        return { kind: "hollow", sweeper: cubeMineSweeperForLevel(level) };
    }

    // --- generic sweeper calls (cast inside, callers don't worry about types) -----------------
    // The two sweepers share method names; only their position/cube argument types differ.
    // Casting through `any` keeps reveal/chord/toggleFlag mode-agnostic at the top level.
    function activeGenerate(safe: AnyPos, s: string): string {
        return (sweeper as any).generateBoardInPlace(cube, safe, s);
    }
    function activeRevealCell(pos: AnyPos): number {
        return (sweeper as any).revealCellInPlace(cube, pos);
    }
    function activeRevealAround(pos: AnyPos): { count: number; minePos?: AnyPos } {
        return (sweeper as any).revealAroundInPlace(cube, pos);
    }
    function activeCountFlagged(pos: AnyPos): number {
        return (sweeper as any).countFlaggedAround(cube, pos);
    }
    function activeToggleFlag(pos: AnyPos): boolean {
        return (sweeper as any).toggleFlagInPlace(cube, pos);
    }
    function activeRevealAllMines(): void {
        (sweeper as any).revealAllMinesInPlace(cube);
    }
    function activeIsWin(): boolean {
        return (sweeper as any).isWin(cube);
    }
    function activeGetCell(pos: AnyPos) {
        if (kind === "voxel") {
            const p = pos as VoxelPos;
            return (cube as VoxelCube)[p.x][p.y][p.z];
        }
        const p = pos as CubePosition;
        return (cube as Cube)[p.face][p.r][p.c];
    }

    // --- lifecycle ----------------------------------------------------------------------------
    function reset() {
        const gen = ++transitionGen;
        transitionPhase = "shrinking";

        setTimeout(() => {
            if (gen !== transitionGen) return;
            if (mode === "endless") level = endlessStartLevel();
            const board = makeBoard();
            kind = board.kind;
            sweeper = board.sweeper;
            cube = (sweeper as any).emptyCube();
            status = GameStatus.Init;
            seed = "";
            flagsPlaced = 0;
            lastStep = null;
            runCheated = false;
            runId += 1;
            transitionPhase = "growing";
        }, TRANSITION_HALF_MS);

        setTimeout(() => {
            if (gen !== transitionGen) return;
            transitionPhase = "idle";
        }, TRANSITION_HALF_MS * 2);
    }

    function setDifficulty(d: Difficulty) {
        if (d === difficulty && mode === "classic") return;
        mode = "classic";
        difficulty = d;
        reset();
    }

    function setMode(m: Mode) {
        if (m === mode) return;
        mode = m;
        reset();
    }

    function setEndlessMode(em: EndlessMode) {
        if (em === endlessMode) return;
        endlessMode = em;
        if (mode === "endless") reset();
    }

    function advanceEndlessLevel() {
        const gen = ++transitionGen;
        transitionPhase = "shrinking";
        opts.onEndlessClear?.();

        setTimeout(() => {
            if (gen !== transitionGen) return;
            level += 1;
            const board = makeBoard();
            kind = board.kind;
            sweeper = board.sweeper;
            cube = (sweeper as any).emptyCube();
            status = GameStatus.Init;
            seed = "";
            flagsPlaced = 0;
            lastStep = null;
            transitionPhase = "growing";
        }, TRANSITION_HALF_MS);

        setTimeout(() => {
            if (gen !== transitionGen) return;
            transitionPhase = "idle";
        }, TRANSITION_HALF_MS * 2);
    }

    function cheatAdvanceLevel() {
        if (mode !== "endless") return;
        if (status === GameStatus.GameOver) return;
        runCheated = true;
        advanceEndlessLevel();
    }

    // --- player actions -----------------------------------------------------------------------
    function reveal(pos: AnyPos): void {
        if (transitionPhase !== "idle") return;
        if (status === GameStatus.GameOver || status === GameStatus.Win) return;
        if (status === GameStatus.Init) {
            seed = activeGenerate(pos, seed);
            status = GameStatus.Gaming;
        }
        const cell = activeGetCell(pos);
        if (cell.isFlagged || cell.isRevealed) return;
        if (cell.isMine) {
            cell.isRevealed = true;
            activeRevealAllMines();
            lastStep = pos;
            status = GameStatus.GameOver;
            // "You died" pattern: long-short-long, more emphatic than the flag tap.
            buzz([120, 60, 120]);
            return;
        }
        activeRevealCell(pos);
        if (activeIsWin()) onWin();
    }

    function toggleFlag(pos: AnyPos): void {
        if (transitionPhase !== "idle") return;
        if (status !== GameStatus.Gaming) return;
        const cell = activeGetCell(pos);
        if (cell.isRevealed) return;
        const before = cell.isFlagged;
        if (activeToggleFlag(pos)) {
            flagsPlaced += before ? -1 : 1;
            // Short buzz on successful flag/unflag. The platform gate lives inside buzz().
            buzz(30);
        }
    }

    function chord(pos: AnyPos): void {
        if (transitionPhase !== "idle") return;
        if (status !== GameStatus.Gaming) return;
        const cell = activeGetCell(pos);
        if (!cell.isRevealed || cell.adjacentMines === 0) return;
        if (activeCountFlagged(pos) !== cell.adjacentMines) return;
        const result = activeRevealAround(pos);
        if (result.minePos) {
            lastStep = result.minePos;
            status = GameStatus.GameOver;
            buzz([120, 60, 120]);
        } else if (activeIsWin()) {
            onWin();
        }
    }

    function onWin() {
        if (mode === "endless") advanceEndlessLevel();
        else status = GameStatus.Win;
    }

    return {
        get mode() { return mode; },
        get endlessMode() { return endlessMode; },
        get difficulty() { return difficulty; },
        get level() { return level; },
        get cubeKind() { return kind; },
        get cube() { return cube; },
        get status() { return status; },
        get seed() { return seed; },
        get N() { return (sweeper as any).N as number; },
        get totalMines() { return (sweeper as any).mines as number; },
        get minesLeft() { return ((sweeper as any).mines as number) - flagsPlaced; },
        get lastStep() { return lastStep; },
        get runId() { return runId; },
        get runCheated() { return runCheated; },
        get transitionPhase() { return transitionPhase; },
        setMode,
        setEndlessMode,
        setDifficulty,
        reset,
        reveal,
        toggleFlag,
        chord,
        cheatAdvanceLevel,
    };
}

export type GameState = ReturnType<typeof createGameState>;
