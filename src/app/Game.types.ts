export enum GameStatus {
    Init = 0,
    Gaming = 1,
    GameOver = 2,
    Win = 3
}

export type Difficulty = "easy" | "medium" | "hard";
export type ActionType = "reveal" | "flag" | "chord";
export type Position = { r: number; c: number };
export type UserAction = {
  type: ActionType;
  position: Position;
};

export type UserActionWithScore = UserAction & {
  score: number;
};