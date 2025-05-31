export enum GameStatus {
  Init = 0,
  Gaming = 1,
  GameOver = 2,
  Win = 3
}

const Difficulty = {
  Easy: "easy",
  Medium: "medium",
  Hard: "hard",
} as const;
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];
export const DifficultyText = {
  [Difficulty.Easy]: "🥉",
  [Difficulty.Medium]: "🥈",
  [Difficulty.Hard]: "🥇",
};
export type ActionType = "reveal" | "flag" | "chord";
export type Position = { r: number; c: number };
export type UserAction = {
  type: ActionType;
  position: Position;
};

export type UserActionDetail = UserAction & {
  score: number;
  time: number;
};
export type PlayHistory = {
    result: "Win" | "Loss";
    time: number;
    difficulty: Difficulty;
    seed: string;
    actions: UserActionDetail[];
    date: string;
};