"use client";
import { useCallback } from "react";
import Game from "./Game";
import DarkModeToggle from "./components/DarkModeToggle";

export default function Home() {
  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      e.preventDefault();
    },
    []);

  return (
    <span onContextMenu={onContextMenu}>
      <DarkModeToggle />
      <Game difficulty={'easy'} />
    </span>
  );
}
