"use client";
import { useCallback } from "react";
import Game from "./Game";

export default function Home() {
  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      e.preventDefault();
    },
    []);
  return <span onContextMenu={onContextMenu}>
    <Game difficulty={'easy'} />
  </span>
}
