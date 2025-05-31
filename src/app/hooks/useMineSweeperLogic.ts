import { useCallback, useEffect, useState } from "react";
import { GameStatus, Position } from "../Game.types";
import { CellType } from "../Cell";

export function useMineSweeperLogic({
    board,
    setBoard,
    gameStatus,
    onBeginGame,
    onWinOrLose,
    sweeper,
}: {
    board: CellType[][];
    setBoard: (b: CellType[][]) => void;
    gameStatus: GameStatus;
    onBeginGame: (board: CellType[][], r: number, c: number, seed: string, replay: boolean) => void;
    onWinOrLose: (s: GameStatus) => void;
    sweeper: {
        mines: number;
        rows: number;
        cols: number;
        generateBoardInPlace: (board: CellType[][], r: number, c: number) => void;
        revealCellInPlace: (board: CellType[][], r: number, c: number) => number;
        countFlaggedAround: (board: CellType[][], r: number, c: number) => number;
        revealAroundInPlace: (board: CellType[][], r: number, c: number) => [number, { r: number, c: number } | undefined];
        revealAllMinesInPlace: (board: CellType[][]) => void;
    };
}) {
    const {
        revealCellInPlace,
        countFlaggedAround,
        revealAroundInPlace,
        revealAllMinesInPlace,
    } = sweeper;
    const [revealedCount, setRevealedCount] = useState(0);
    const [flagCount, setFlagCount] = useState(0);
    const [revealedMinePosition, setRevealedMinePos] = useState<Position>();
    const requiredRevealedCount = sweeper.rows * sweeper.cols - sweeper.mines;

    useEffect(() => {
        if (gameStatus === GameStatus.Gaming) {
            if (revealedCount === requiredRevealedCount)
                onWinOrLose?.(GameStatus.Win);
            else if (revealedMinePosition)
                onWinOrLose?.(GameStatus.GameOver);
        }
    }, [revealedCount, requiredRevealedCount, gameStatus, onWinOrLose, revealedMinePosition]);

    useEffect(() => {
        // reset
        if (gameStatus === GameStatus.Init) {
            setRevealedCount(0);
            setFlagCount(0);
            setRevealedMinePos(undefined);
        }
    }, [gameStatus]);

    const handleChordCell = useCallback((r: number, c: number) => {
        if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return 0;
        if (board[r][c].isRevealed && board[r][c].adjacentMines > 0) {
            const flagged = countFlaggedAround(board, r, c);
            if (flagged === board[r][c].adjacentMines) {
                const [revealedCount, minePos] = revealAroundInPlace(board, r, c);
                if (revealedCount === 0) return 0; // No cells revealed
                setRevealedCount(val => val + revealedCount);
                const gameOver = revealedCount === -1;
                if (gameOver) {
                    revealAllMinesInPlace(board);
                    setBoard([...board]);
                    setRevealedMinePos(minePos);
                    return -1;
                }
                const newBoard = [...board];
                setBoard(newBoard);
                return revealedCount;
            }
        }
        return 0;
    }, [
        gameStatus,
        board,
        setBoard,
        countFlaggedAround,
        revealAroundInPlace,
        revealAllMinesInPlace,
    ]);

    const handleFlagCell = useCallback((r: number, c: number) => {
        if (
            gameStatus === GameStatus.GameOver ||
            gameStatus === GameStatus.Win ||
            gameStatus === GameStatus.Init
        )
            return 0;
        const cell = board[r][c];
        if (cell.isRevealed) return 0;

        if (cell.isFlagged) {
            setFlagCount((count) => count - 1);
        } else {
            setFlagCount((count) => count + 1);
        }

        const newBoard = [...board];
        newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
        setBoard(newBoard);
        return 1;
    }, [gameStatus, board, setBoard]);

    const handleCellClick = useCallback((r: number, c: number, seed = "", replay = false) => {
        if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return 0;
        if (gameStatus === GameStatus.Init) {
            // First click: generate board with safe cell
            onBeginGame(board, r, c, seed, replay);
        }
        const cell = board[r][c];
        if (cell.isFlagged || cell.isRevealed) return 0;
        if (cell.isMine) {
            revealAllMinesInPlace(board);
            const newBoard = [...board];
            setBoard(newBoard);
            setRevealedMinePos({ r, c });
            return -1;
        }
        const revealedCount = revealCellInPlace(board, r, c);
        setRevealedCount(val => val + revealedCount);
        const newBoard = [...board];
        setBoard(newBoard);
        return 1;
    }, [
        gameStatus,
        board,
        setBoard,
        onBeginGame,
        revealCellInPlace,
        revealAllMinesInPlace,
    ]);

    return { flagCount, revealedMinePosition, handleCellClick, handleFlagCell, handleChordCell };
}