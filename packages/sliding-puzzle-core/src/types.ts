export type GameMode = 'number' | 'image';

export type Tile = number | null;

export interface GameState {
    board: Tile[];
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
