import type { Difficulty } from "@caiji-games/minesweeper-cube-core";

export type CubeHistoryEntry = {
    result: "Win" | "Loss";
    time: number;       // seconds
    date: string;       // ISO timestamp
};

export type ByDifficulty<T> = Record<Difficulty, T[]>;

export const emptyByDifficulty = (): ByDifficulty<CubeHistoryEntry> => ({
    easy: [], medium: [], hard: [],
});
