import { useRef, useState } from "react";
import { GameStatus, UserAction } from "./Game.types";

type UseDesktopMouseProps = {
    gameStatus: GameStatus;
    handleFlagCell: (r: number, c: number) => number;
    handleChordCell: (r: number, c: number) => number;
    handleCellClick: (r: number, c: number) => number;
    addUserAction: (action: UserAction) => void;
};

export function useDesktopMouse({
    gameStatus,
    handleFlagCell,
    handleChordCell,
    handleCellClick,
    addUserAction,
}: UseDesktopMouseProps) {
    const mouseDownRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
    const [mouseCell, setMouseCell] = useState<{ r: number; c: number } | null>(null);

    function handleMouseDown(
        e: React.MouseEvent<HTMLButtonElement>,
        r: number,
        c: number
    ) {
        if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
        if (gameStatus === GameStatus.Init && e.button === 2) return;
        if (e.button === 0) mouseDownRef.current.left = true;
        if (e.button === 2) mouseDownRef.current.right = true;
        setMouseCell({ r, c });
    }

    function handleMouseUp(
        e: React.MouseEvent<HTMLButtonElement>,
        r: number,
        c: number
    ) {
        if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
        if (mouseCell && mouseCell.r === r && mouseCell.c === c) {
            if (mouseDownRef.current.left && mouseDownRef.current.right) {
                const score = handleChordCell(r, c);
                addUserAction({ type: "chord", position: { r, c }, score });
            } else if (mouseDownRef.current.left && e.button === 0) {
                const score = handleCellClick(r, c);
                addUserAction({ type: "reveal", position: { r, c }, score });
            } else if (mouseDownRef.current.right && e.button === 2) {
                const score = handleFlagCell(r, c);
                addUserAction({ type: "flag", position: { r, c }, score });
            }
            setMouseCell(null);
        }
        if (e.button === 0) mouseDownRef.current.left = false;
        if (e.button === 2) mouseDownRef.current.right = false;
    }

    function handleMouseLeave() {
        if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
        if (!mouseCell) return;
        setMouseCell(null);
        mouseDownRef.current.left = false;
        mouseDownRef.current.right = false;
    }

    return {
        mouseDownRef,
        mouseCell,
        setMouseCell,
        handleMouseDown,
        handleMouseUp,
        handleMouseLeave,
    };
}