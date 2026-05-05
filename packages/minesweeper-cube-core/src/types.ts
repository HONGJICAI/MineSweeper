export enum GameStatus {
    Init = 0,
    Gaming = 1,
    GameOver = 2,
    Win = 3,
}

// Six faces of the cube. Letters chosen so the set is visually distinct in logs/tests:
//   F = front (+Z), B = back (-Z), L = left (-X), R = right (+X), T = top (+Y), D = down/bottom (-Y).
export const FACES = ["F", "B", "L", "R", "T", "D"] as const;
export type Face = (typeof FACES)[number];

export type CubeCell = {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    adjacentMines: number;
};

// Cube state: one NxN grid per face, indexed by face letter.
export type Cube = Record<Face, CubeCell[][]>;

export type CubePosition = { face: Face; r: number; c: number };

export type ActionType = "reveal" | "flag" | "chord";

export type Difficulty = "easy" | "medium" | "hard";

export type Mode = "classic" | "endless";

// Endless sub-modes. "normal" is the classic-style hollow surface that grows N each round.
// "voxel" uses a 3D Rubik's-cube data model where edge/corner cells are physically merged and
// future rounds' inner mines naturally affect the outer surface via 3D Moore adjacency.
export type EndlessMode = "normal" | "voxel";
