import {
    cubeMineSweeperForLevel,
    ENDLESS_START_LEVEL,
    GameStatus,
    sweeperForDifficulty,
    type Cube,
    type CubePosition,
    type CubeSweeper,
    type Difficulty,
    type Mode,
} from "@caiji-games/minesweeper-cube-core";

export function createGameState(initial: Difficulty = "easy") {
    const initialSweeper = sweeperForDifficulty(initial);
    let mode = $state<Mode>("classic");
    let difficulty = $state<Difficulty>(initial);
    // Endless: current level (=N). Only meaningful when mode === "endless".
    let level = $state<number>(ENDLESS_START_LEVEL);
    // Sweeper bundles the pure logic; recreated on difficulty/level change.
    let sweeper: CubeSweeper = $state.raw(initialSweeper);
    let cube = $state<Cube>(initialSweeper.emptyCube());
    let status = $state<GameStatus>(GameStatus.Init);
    let seed = $state<string>("");
    let flagsPlaced = $state<number>(0);
    // The mine the player actually stepped on (vs. mines auto-revealed alongside it).
    // Mirrors the 2D core's `lastStepOnMine` state — used to highlight that one cell red.
    let lastStep = $state<CubePosition | null>(null);
    // Bumps on every fresh-start (reset, mode/difficulty change). Does NOT bump when an endless
    // run advances levels — that lets consumers (timer) tell "new run" from "same run, next cube".
    let runId = $state<number>(0);
    // Set when the player invokes the dev cheat code to skip levels. Used to keep cheated runs
    // out of the leaderboard. Cleared on reset.
    let runCheated = $state<boolean>(false);
    // Level-bump animation phase. "shrinking" plays right after a clear (data still on the old
    // cube), then we swap to the new cube and play "growing" back to full size. UI uses this to
    // drive the scale tween and to lock input.
    let transitionPhase = $state<"idle" | "shrinking" | "growing">("idle");
    // Generation counter to invalidate in-flight setTimeout callbacks when the run gets reset
    // mid-transition (mode change, manual reset, etc.).
    let transitionGen = 0;
    // Half-duration of the level-bump transition (one for shrinking the old cube, one for growing
    // the new one). PURELY VISUAL — the timer is paused while transitionPhase !== "idle" (see
    // App.svelte's effect), so changing this does NOT affect leaderboard fairness across versions.
    // Free to tune for future animations.
    const TRANSITION_HALF_MS = 250;

    function makeSweeper(): CubeSweeper {
        return mode === "endless" ? cubeMineSweeperForLevel(level) : sweeperForDifficulty(difficulty);
    }

    function reset() {
        if (mode === "endless") level = ENDLESS_START_LEVEL;
        sweeper = makeSweeper();
        cube = sweeper.emptyCube();
        status = GameStatus.Init;
        seed = "";
        flagsPlaced = 0;
        lastStep = null;
        runCheated = false;
        // Cancel any in-flight transition.
        transitionGen++;
        transitionPhase = "idle";
        runId += 1;
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

    // Endless: split into two phases so the UI can play a "shrink old cube, grow new cube"
    // animation. Generation counter guards against setTimeout firing after a reset. Input is
    // locked while transitionPhase !== "idle" via the guards in reveal/chord/toggleFlag.
    function advanceEndlessLevel() {
        const gen = ++transitionGen;
        transitionPhase = "shrinking";

        setTimeout(() => {
            if (gen !== transitionGen) return;
            // Animation midpoint: swap board data, then start growing back.
            level += 1;
            sweeper = cubeMineSweeperForLevel(level);
            cube = sweeper.emptyCube();
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

    // Dev cheat: jump to the next level without solving the cube. Marks the run cheated so the
    // result doesn't end up on the leaderboard. No-op outside endless / mid-run states.
    function cheatAdvanceLevel() {
        if (mode !== "endless") return;
        if (status === GameStatus.GameOver) return;
        runCheated = true;
        advanceEndlessLevel();
    }

    function reveal(pos: CubePosition): void {
        if (transitionPhase !== "idle") return;
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
        if (sweeper.isWin(cube)) onWin();
    }

    function toggleFlag(pos: CubePosition): void {
        if (transitionPhase !== "idle") return;
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
        if (transitionPhase !== "idle") return;
        if (status !== GameStatus.Gaming) return;
        const cell = cube[pos.face][pos.r][pos.c];
        if (!cell.isRevealed || cell.adjacentMines === 0) return;
        if (sweeper.countFlaggedAround(cube, pos) !== cell.adjacentMines) return;
        const result = sweeper.revealAroundInPlace(cube, pos);
        if (result.minePos) {
            lastStep = result.minePos;
            status = GameStatus.GameOver;
        } else if (sweeper.isWin(cube)) {
            onWin();
        }
    }

    // Endless: don't show a Win state — immediately advance. Classic: terminate normally.
    function onWin() {
        if (mode === "endless") advanceEndlessLevel();
        else status = GameStatus.Win;
    }

    return {
        get mode() { return mode; },
        get difficulty() { return difficulty; },
        get level() { return level; },
        get cube() { return cube; },
        get status() { return status; },
        get seed() { return seed; },
        get N() { return sweeper.N; },
        get totalMines() { return sweeper.mines; },
        get minesLeft() { return sweeper.mines - flagsPlaced; },
        get lastStep() { return lastStep; },
        get runId() { return runId; },
        get runCheated() { return runCheated; },
        get transitionPhase() { return transitionPhase; },
        setMode,
        setDifficulty,
        reset,
        reveal,
        toggleFlag,
        chord,
        cheatAdvanceLevel,
    };
}

export type GameState = ReturnType<typeof createGameState>;
