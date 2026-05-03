// 2D minesweeper persisted state. Note no namespace prefix here for backwards compatibility:
// existing players' localStorage keys ("leaderboards", "playHistoryMap") were unprefixed before
// the shared hook extraction, so we keep them that way to preserve their saved data.
import { persistedState as _persistedState } from "@caiji-games/shared-state";

export const persistedState = _persistedState;
