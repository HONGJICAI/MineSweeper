export enum GameStatus {
    Init = 0,
    Gaming = 1,
    GameOver = 2,
    Win = 3
}

export type Difficulty = "easy" | "medium" | "hard";
export type ActionType = "reveal" | "flag" | "chord";
export type UserAction = {
  type: ActionType;
  position: { r: number; c: number };
  score: number;
};
