import React from "react";
import Leaderboard from "./Leaderboard";
import UserActionsList from "./UserActionsList";
import HistoryList from "./HistoryList";
import { UserAction } from "./Game.types";
import { PlayHistory } from "./usePlayHistory";
import { Leaderboards } from "./useLeaderboard";

type GameSidebarProps = {
  leaderboards: Leaderboards | null;
  difficulty: "easy" | "medium" | "hard";
  userActions: UserAction[];
  setHoveredCell: (cell: { r: number; c: number } | null) => void;
  playHistory: PlayHistory[] | null;
};

export default function GameSidebar({
  leaderboards,
  difficulty,
  userActions,
  setHoveredCell,
  playHistory,
}: GameSidebarProps) {
  return (
    <div className="flex flex-col items-start flex-shrink-0 w-full max-w-xs gap-4 h-full">
      <Leaderboard leaderboards={leaderboards} difficulty={difficulty} />
      <UserActionsList userActions={userActions} setHoveredCell={setHoveredCell} />
      <HistoryList playHistory={playHistory} />
    </div>
  );
}