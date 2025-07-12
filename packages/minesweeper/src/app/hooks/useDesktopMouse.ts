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
    
    // Use ref to always have the latest mouseAction without causing re-renders
    const mouseActionRef = useRef(mouseAction);
    mouseActionRef.current = mouseAction;

    const resetMouseAction = useCallback(() => {
        setMouseAction({
            leftDown: false,
            rightDown: false,
            position: { r: -1, c: -1 },
        });
    } , []);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => {
            if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
            if (gameStatus === GameStatus.Init && e.button === 2) return;
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
        [gameStatus]
    );

    const handleMouseUp = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>, r: number, c: number) => {
            if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
            
            // Use ref to get the current mouseAction
            const currentMouseAction = mouseActionRef.current;
            
            if (currentMouseAction.position.r === r && currentMouseAction.position.c === c) {
                if (currentMouseAction.leftDown && currentMouseAction.rightDown) {
                    onCellAction({ type: "chord", position: { r, c } });
                } else if (currentMouseAction.leftDown && e.button === 0) {
                    onCellAction({ type: "reveal", position: { r, c } });
                } else if (currentMouseAction.rightDown && e.button === 2) {
                    onCellAction({ type: "flag", position: { r, c } });
                }
            }
            resetMouseAction();
            e.stopPropagation();
        },
        [gameStatus, onCellAction, resetMouseAction] // No mouseAction dependency!
    );

    return {
        mouseAction,
        resetMouseAction,
        handleMouseDown,
        handleMouseUp,
    };
}