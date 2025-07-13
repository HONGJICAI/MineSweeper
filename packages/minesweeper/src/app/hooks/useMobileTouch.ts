import { useRef, useState } from "react";
import { GameStatus } from "../Game.types";

type UseMobileTouchProps = {
  gameStatus: GameStatus;
  handleFlagCell: (r: number, c: number) => number;
  handleChordCell: (r: number, c: number) => number;
  handleCellClick: (r: number, c: number) => number;
  mobileAction: "reveal" | "flag";
  board: { isRevealed: boolean }[][];
};

export function useMobileTouch({
  gameStatus,
  handleFlagCell,
  handleChordCell,
  handleCellClick,
  mobileAction,
  board,
}: UseMobileTouchProps) {
  const isMobileRef = useRef(false);
  const [mouseCell, setMouseCell] = useState<{ r: number; c: number } | null>(null);
  const mouseDownRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  function handleTouchStart(
    e: React.TouchEvent<HTMLButtonElement>,
    r: number,
    c: number
  ) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
    e.preventDefault();
    isMobileRef.current = true;
    setMouseCell({ r, c });
    mouseDownRef.current.left = true;
  }

  function handleTouchEnd(
    _: React.TouchEvent<HTMLButtonElement>,
    r: number,
    c: number
  ) {
    if (gameStatus === GameStatus.GameOver || gameStatus === GameStatus.Win) return;
    if (mouseCell && mouseCell.r === r && mouseCell.c === c) {
      if (mobileAction === "flag") {
        handleFlagCell(r, c);
      } else {
        if (board[r][c].isRevealed) {
          handleChordCell(r, c);
        } else {
          handleCellClick(r, c);
        }
      }
    }
    setMouseCell(null);
    mouseDownRef.current.left = false;
    mouseDownRef.current.right = false;
  }

  return {
    isMobileRef,
    mouseCell,
    setMouseCell,
    mouseDownRef,
    handleTouchStart,
    handleTouchEnd,
  };
}