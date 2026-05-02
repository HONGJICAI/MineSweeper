import {
    GameStatus,
    easyMineSweeper,
    hardMineSweeper,
    mediumMineSweeper,
    type Board,
    type Difficulty,
    type Position,
    type Sweeper,
} from "@caiji-games/minesweeper-core";

function makeSweeper(d: Difficulty): Sweeper {
    if (d === "easy") return easyMineSweeper();
    if (d === "medium") return mediumMineSweeper();
    return hardMineSweeper();
}

export function createGameState(initialDifficulty: Difficulty = "easy") {
    const initialSweeper = makeSweeper(initialDifficulty);
    let difficulty = $state<Difficulty>(initialDifficulty);
    let sweeper = $state<Sweeper>(initialSweeper);
    let board = $state<Board>(initialSweeper.createEmptyBoard());
    let gameStatus = $state<GameStatus>(GameStatus.Init);
    let revealedCount = $state(0);
    let flagCount = $state(0);
    let revealedMinePos = $state<Position | undefined>(undefined);
    let seed = $state("");

    const requiredRevealedCount = $derived(sweeper.rows * sweeper.cols - sweeper.mines);

    $effect(() => {
        if (gameStatus !== GameStatus.Gaming) return;
        if (revealedCount === requiredRevealedCount) {
            gameStatus = GameStatus.Win;
        } else if (revealedMinePos) {
            gameStatus = GameStatus.GameOver;
        }
    });

    function reveal(r: number, c: number, withSeed = "", replay = false): number {
        if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return 0;

        if (gameStatus === GameStatus.Init) {
            seed = sweeper.generateBoardInPlace(board, r, c, withSeed, replay);
            gameStatus = GameStatus.Gaming;
        }

        const cell = board[r][c];
        if (cell.isFlagged || cell.isRevealed) return 0;

        if (cell.isMine) {
            sweeper.revealAllMinesInPlace(board);
            revealedMinePos = { r, c };
            return -1;
        }

        const count = sweeper.revealCellInPlace(board, r, c);
        revealedCount += count;
        return count;
    }

    function chord(r: number, c: number): number {
        if (gameStatus !== GameStatus.Gaming) return 0;
        const cell = board[r][c];
        if (!cell.isRevealed || cell.adjacentMines === 0) return 0;
        if (sweeper.countFlaggedAround(board, r, c) !== cell.adjacentMines) return 0;

        const { count, minePos } = sweeper.revealAroundInPlace(board, r, c);
        if (count > 0) revealedCount += count;
        if (minePos) {
            revealedMinePos = minePos;
            return -1;
        }
        return count;
    }

    function toggleFlag(r: number, c: number): number {
        if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return 0;
        if (gameStatus === GameStatus.Init) return 0;
        const wasFlagged = board[r][c].isFlagged;
        if (!sweeper.toggleFlagInPlace(board, r, c)) return 0;
        flagCount += wasFlagged ? -1 : 1;
        return 1;
    }

    function reset() {
        board = sweeper.createEmptyBoard();
        gameStatus = GameStatus.Init;
        revealedCount = 0;
        flagCount = 0;
        revealedMinePos = undefined;
        seed = "";
    }

    function setDifficulty(d: Difficulty) {
        if (d === difficulty) return;
        difficulty = d;
        sweeper = makeSweeper(d);
        reset();
    }

    return {
        get difficulty() { return difficulty; },
        get sweeper() { return sweeper; },
        get board() { return board; },
        get gameStatus() { return gameStatus; },
        get revealedCount() { return revealedCount; },
        get flagCount() { return flagCount; },
        get revealedMinePos() { return revealedMinePos; },
        get seed() { return seed; },
        get minesLeft() { return sweeper.mines - flagCount; },
        get isInteractive() {
            return gameStatus !== GameStatus.GameOver && gameStatus !== GameStatus.Win;
        },
        setDifficulty,
        reveal,
        chord,
        toggleFlag,
        reset,
    };
}

export type GameState = ReturnType<typeof createGameState>;
