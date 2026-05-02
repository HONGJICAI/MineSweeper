import { useState, useCallback, useRef } from "react";
import { GameStatus, UserAction } from "../Game.types";

type MouseAction = {
    leftDown: boolean;
    rightDown: boolean;
    position: { r: number; c: number };
}

type UseDesktopMouseProps = {
    gameStatus: GameStatus;
    onCellAction: (action: UserAction) => void;
};

export function useDesktopMouse({
    gameStatus,
    onCellAction,
}: UseDesktopMouseProps) {
    const [mouseAction, setMouseAction] = useState<MouseAction>({
        leftDown: false,
        rightDown: false,
        position: { r: -1, c: -1 },
    });

    // Latest-ref pattern: handlers below have empty deps so they stay referentially
    // stable, which lets React.memo on Cell actually skip re-renders for cells that
    // didn't change.
    const mouseActionRef = useRef(mouseAction);
    mouseActionRef.current = mouseAction;
    const gameStatusRef = useRef(gameStatus);
    gameStatusRef.current = gameStatus;
    const onCellActionRef = useRef(onCellAction);
    onCellActionRef.current = onCellAction;

    const resetMouseAction = useCallback(() => {
        setMouseAction({
            leftDown: false,
            rightDown: false,
            position: { r: -1, c: -1 },
        });
    }, []);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => {
            const status = gameStatusRef.current;
            if (status === GameStatus.GameOver || status === GameStatus.Win) return;
            if (status === GameStatus.Init && e.button === 2) return;
            if (e.button === 0)
                setMouseAction(prev => ({
                    ...prev,
                    leftDown: true,
                    position: { r, c }
                }));
            if (e.button === 2)
                setMouseAction(prev => ({
                    ...prev,
                    rightDown: true,
                    position: { r, c }
                }));
            e.stopPropagation();
        },
        []
    );

    const handleMouseUp = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => {
            const status = gameStatusRef.current;
            if (status === GameStatus.GameOver || status === GameStatus.Win) return;

            const current = mouseActionRef.current;
            if (current.position.r === r && current.position.c === c) {
                if (current.leftDown && current.rightDown) {
                    onCellActionRef.current({ type: "chord", position: { r, c } });
                } else if (current.leftDown && e.button === 0) {
                    onCellActionRef.current({ type: "reveal", position: { r, c } });
                } else if (current.rightDown && e.button === 2) {
                    onCellActionRef.current({ type: "flag", position: { r, c } });
                }
            }
            resetMouseAction();
            e.stopPropagation();
        },
        [resetMouseAction]
    );

    return {
        mouseAction,
        resetMouseAction,
        handleMouseDown,
        handleMouseUp,
    };
}
