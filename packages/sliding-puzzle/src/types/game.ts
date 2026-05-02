export type GameMode = 'number' | 'image';

export interface GameState {
  board: (number | null)[];
  size: number;
  emptyIndex: number;
  moves: number;
  startTime: number | null;
  endTime: number | null;
  isCompleted: boolean;
}

export interface GameStats {
  moves: number;
  time: number;
  isCompleted: boolean;
}

export interface Position {
  row: number;
  col: number;
}
