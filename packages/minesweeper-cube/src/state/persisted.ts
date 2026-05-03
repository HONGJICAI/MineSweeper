import { createPersistedState } from "@caiji-games/shared-state";

// localStorage namespace: keep cube state separate from any other game in the workspace.
export const persistedState = createPersistedState("minesweeper-cube:");
