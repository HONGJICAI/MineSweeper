import { useCallback, useEffect, useState } from "react";
import { GameStatus, Position } from "../Game.types";
import { Sweeper } from "../utils/minesweeperLogic";
import { CellType } from "../Cell";

type Board = CellType[][];

export function useMineSweeperLogic({
    board,
    setBoard,
    gameStatus,
    onBeginGame,
    onWinOrLose,
    sweeper,
}: {
    board: Board;
    setBoard: (b: Board) => void;
    gameStatus: GameStatus;
    onBeginGame: (seed: string) => void;
    onWinOrLose: (s: GameStatus) => void;
    sweeper: Sweeper;
}) {
    const {
        generateBoard,
        revealCell,
        countFlaggedAround,
        revealAround,
        revealAllMines,
        toggleFlag,
    } = sweeper;
    const [revealedCount, setRevealedCount] = useState(0);
    const [flagCount, setFlagCount] = useState(0);
    const [revealedMinePosition, setRevealedMinePos] = useState<Position>();
    const requiredRevealedCount = sweeper.rows * sweeper.cols - sweeper.mines;

    useEffect(() => {
        if (gameStatus !== GameStatus.Gaming) return;
        if (revealedCount === requiredRevealedCount) {
            onWinOrLose?.(GameStatus.Win);
        } else if (revealedMinePosition) {
            onWinOrLose?.(GameStatus.GameOver);
        }
    }, [revealedCount, requiredRevealedCount, gameStatus, onWinOrLose, revealedMinePosition]);

    useEffect(() => {
        if (gameStatus === GameStatus.Init) {
            setRevealedCount(0);
            setFlagCount(0);
            setRevealedMinePos(undefined);
        }
    }, [gameStatus]);

    const handleChordCell = useCallback((r: number, c: number) => {
        if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return 0;
        const cell = board[r][c];
        if (!cell.isRevealed || cell.adjacentMines === 0) return 0;
        if (countFlaggedAround(board, r, c) !== cell.adjacentMines) return 0;

        const { board: newBoard, count, minePos } = revealAround(board, r, c);
        if (count === 0 && !minePos) return 0;

        setBoard(newBoard);
        if (count > 0) setRevealedCount(v => v + count);
        if (minePos) {
            setRevealedMinePos(minePos);
            return -1;
        }
        return count;
    }, [gameStatus, board, setBoard, countFlaggedAround, revealAround]);

    const handleFlagCell = useCallback((r: number, c: number) => {
        if (
            gameStatus === GameStatus.GameOver ||
            gameStatus === GameStatus.Win ||
            gameStatus === GameStatus.Init
        ) return 0;
        const cell = board[r][c];
        if (cell.isRevealed) return 0;

        const newBoard = toggleFlag(board, r, c);
        if (newBoard === board) return 0;

        setBoard(newBoard);
        setFlagCount(prev => cell.isFlagged ? prev - 1 : prev + 1);
        return 1;
    }, [gameStatus, board, setBoard, toggleFlag]);

    const handleCellClick = useCallback((r: number, c: number, seed = "", replay = false) => {
        if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return 0;

        let workingBoard = board;
        if (gameStatus === GameStatus.Init) {
            const result = generateBoard(r, c, seed, replay);
            workingBoard = result.board;
            onBeginGame(result.seed);
        }

        const cell = workingBoard[r][c];
        if (cell.isFlagged || cell.isRevealed) {
            if (workingBoard !== board) setBoard(workingBoard);
            return 0;
        }

        if (cell.isMine) {
            setBoard(revealAllMines(workingBoard));
            setRevealedMinePos({ r, c });
            return -1;
        }

        const { board: revealedBoard, count } = revealCell(workingBoard, r, c);
        setBoard(revealedBoard);
        setRevealedCount(v => v + count);
        return 1;
    }, [gameStatus, board, setBoard, generateBoard, revealCell, revealAllMines, onBeginGame]);

    return { flagCount, revealedMinePosition, handleCellClick, handleFlagCell, handleChordCell };
}
