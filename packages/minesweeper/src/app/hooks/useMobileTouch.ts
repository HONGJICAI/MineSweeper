import { useCallback, useRef } from "react";
import { GameStatus, UserAction } from "../Game.types";
import { CellType } from "../Cell";

const DRAG_THRESHOLD_PX = 10;

type TouchStart = {
    r: number;
    c: number;
    x: number;
    y: number;
    cancelled: boolean;
};

type UseMobileTouchProps = {
    gameStatus: GameStatus;
    onCellAction: (action: UserAction) => void;
    mobileAction: "reveal" | "flag";
    board: CellType[][];
};

export function useMobileTouch({
    gameStatus,
    onCellAction,
    mobileAction,
    board,
}: UseMobileTouchProps) {
    const startRef = useRef<TouchStart | null>(null);

    const handleTouchStart = useCallback(
        (e: React.TouchEvent<HTMLButtonElement>, r: number, c: number) => {
            if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
            const t = e.touches[0];
            startRef.current = {
                r,
                c,
                x: t?.clientX ?? 0,
                y: t?.clientY ?? 0,
                cancelled: false,
            };
        },
        [gameStatus]
    );

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        const start = startRef.current;
        if (!start || start.cancelled) return;
        const t = e.touches[0];
        if (!t) return;
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        if (dx * dx + dy * dy > DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
            start.cancelled = true;
        }
    }, []);

    const handleTouchEnd = useCallback(
        (e: React.TouchEvent<HTMLButtonElement>, r: number, c: number) => {
            const start = startRef.current;
            startRef.current = null;
            if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
            if (!start || start.cancelled) return;
            if (start.r !== r || start.c !== c) return;

            // Suppress the synthetic mousedown/mouseup that fire after a tap on
            // touch devices, otherwise the desktop mouse hook would double-trigger.
            e.preventDefault();

            if (mobileAction === "flag") {
                onCellAction({ type: "flag", position: { r, c } });
            } else if (board[r][c].isRevealed) {
                onCellAction({ type: "chord", position: { r, c } });
            } else {
                onCellAction({ type: "reveal", position: { r, c } });
            }
        },
        [gameStatus, mobileAction, board, onCellAction]
    );

    const handleTouchCancel = useCallback(() => {
        startRef.current = null;
    }, []);

    return { handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel };
}
