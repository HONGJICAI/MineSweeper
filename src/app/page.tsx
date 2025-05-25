"use client";
import Game from "./Game";

export default function Home() {
  return <span onContextMenu={e => e.preventDefault()}>
    <Game difficulty={'easy'} />
  </span>
}
