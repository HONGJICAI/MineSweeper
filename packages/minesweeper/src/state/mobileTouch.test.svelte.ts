import { describe, test, expect, beforeEach, vi, type Mock } from "vitest";
import { createMobileTouchState, type MobileMode } from "./mobileTouch.svelte.ts";
import type { Board } from "@caiji-games/minesweeper-core";

// Minimal board builder. Only the fields isPressed/onTouchEnd actually read are populated, so a
// test board stays readable: "3" is a revealed 3, "." an unrevealed cell, "R" a revealed blank.
function makeBoard(rows: string[]): Board {
    return rows.map((row) =>
        [...row].map((ch) => ({
            isRevealed: ch !== ".",
            isFlagged: false,
            isMine: false,
            adjacentMines: /[1-8]/.test(ch) ? Number(ch) : 0,
        })),
    ) as unknown as Board;
}

function touchAt(x: number, y: number): TouchEvent {
    return { touches: [{ clientX: x, clientY: y }], preventDefault: () => {} } as unknown as TouchEvent;
}

type Harness = ReturnType<typeof createMobileTouchState>;

let board: Board;
let mode: MobileMode;
let interactive: boolean;
// Typed explicitly: a bare vi.fn() infers a signature too wide to satisfy the Options callbacks,
// and svelte-check runs as part of the build, so it would break `pnpm run build`.
type CellCallback = Mock<(r: number, c: number) => void>;
let onReveal: CellCallback;
let onFlag: CellCallback;
let onChord: CellCallback;

function create(): Harness {
    return createMobileTouchState({
        onReveal,
        onFlag,
        onChord,
        getBoard: () => board,
        getMode: () => mode,
        isInteractive: () => interactive,
    });
}

beforeEach(() => {
    // Centre cell (1,1) is a revealed 3 surrounded by unrevealed cells — the classic chord setup.
    board = makeBoard([
        "...",
        ".3.",
        "...",
    ]);
    mode = "reveal";
    interactive = true;
    onReveal = vi.fn();
    onFlag = vi.fn();
    onChord = vi.fn();
});

describe("isPressed — the touched cell itself", () => {
    test("nothing is pressed before a touch starts", () => {
        const t = create();
        expect(t.isPressed(0, 0, true)).toBe(false);
    });

    test("the touched cell reads as pressed", () => {
        const t = create();
        t.onTouchStart(touchAt(0, 0), 0, 0);
        expect(t.isPressed(0, 0, true)).toBe(true);
    });

    test("cells the caller marks unpressable never light up", () => {
        // Board.svelte passes false for revealed/flagged cells and after game over. Without this
        // guard a chord preview would highlight the number being pressed as well as its
        // neighbours, which is not how the classic game looks.
        const t = create();
        t.onTouchStart(touchAt(0, 0), 0, 0);
        expect(t.isPressed(0, 0, false)).toBe(false);
    });

    test("dragging past the threshold clears the press", () => {
        const t = create();
        t.onTouchStart(touchAt(0, 0), 0, 0);
        expect(t.isPressed(0, 0, true)).toBe(true);

        t.onTouchMove(touchAt(50, 50));
        expect(t.isPressed(0, 0, true)).toBe(false);
    });

    test("a small wobble under the threshold keeps the press", () => {
        const t = create();
        t.onTouchStart(touchAt(0, 0), 0, 0);
        t.onTouchMove(touchAt(3, 3));
        expect(t.isPressed(0, 0, true)).toBe(true);
    });

    test("touch end clears everything", () => {
        const t = create();
        t.onTouchStart(touchAt(0, 0), 0, 0);
        t.onTouchEnd(touchAt(0, 0), 0, 0);
        expect(t.isPressed(0, 0, true)).toBe(false);
    });
});

describe("isPressed — chord preview on a revealed number", () => {
    test("all eight neighbours of the pressed number light up", () => {
        const t = create();
        t.onTouchStart(touchAt(0, 0), 1, 1);

        const lit: string[] = [];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (r === 1 && c === 1) continue; // the number itself is revealed, so unpressable
                if (t.isPressed(r, c, true)) lit.push(`${r},${c}`);
            }
        }
        expect(lit).toHaveLength(8);
    });

    test("cells two rows away are not neighbours", () => {
        board = makeBoard([
            ".....",
            "..3..",
            ".....",
            ".....",
        ]);
        const t = create();
        t.onTouchStart(touchAt(0, 0), 1, 2);

        expect(t.isPressed(0, 1, true)).toBe(true);  // diagonal neighbour
        expect(t.isPressed(3, 2, true)).toBe(false); // two rows below
        expect(t.isPressed(1, 0, true)).toBe(false); // two columns left
    });

    test("no preview in flag mode — releasing flags the cell, it never chords", () => {
        mode = "flag";
        const t = create();
        t.onTouchStart(touchAt(0, 0), 1, 1);

        expect(t.isPressed(0, 0, true)).toBe(false);
        expect(t.isPressed(0, 1, true)).toBe(false);
    });

    test("pressing an unrevealed cell previews only that cell", () => {
        const t = create();
        t.onTouchStart(touchAt(0, 0), 0, 0);

        expect(t.isPressed(0, 0, true)).toBe(true);
        expect(t.isPressed(0, 1, true)).toBe(false);
        expect(t.isPressed(1, 1, true)).toBe(false);
    });

    test("a revealed blank previews nothing — a chord there opens nothing", () => {
        board = makeBoard([
            "...",
            ".R.",
            "...",
        ]);
        const t = create();
        t.onTouchStart(touchAt(0, 0), 1, 1);

        expect(t.isPressed(0, 0, true)).toBe(false);
        expect(t.isPressed(0, 1, true)).toBe(false);
    });

    test("dragging off cancels the chord preview too", () => {
        const t = create();
        t.onTouchStart(touchAt(0, 0), 1, 1);
        expect(t.isPressed(0, 0, true)).toBe(true);

        t.onTouchMove(touchAt(50, 50));
        expect(t.isPressed(0, 0, true)).toBe(false);
    });
});

describe("release behaviour still matches the preview", () => {
    test("releasing on a revealed number chords", () => {
        const t = create();
        t.onTouchStart(touchAt(0, 0), 1, 1);
        t.onTouchEnd(touchAt(0, 0), 1, 1);
        expect(onChord).toHaveBeenCalledWith(1, 1);
        expect(onReveal).not.toHaveBeenCalled();
    });

    test("releasing on an unrevealed cell reveals it", () => {
        const t = create();
        t.onTouchStart(touchAt(0, 0), 0, 0);
        t.onTouchEnd(touchAt(0, 0), 0, 0);
        expect(onReveal).toHaveBeenCalledWith(0, 0);
        expect(onChord).not.toHaveBeenCalled();
    });

    test("flag mode flags instead, matching the absent chord preview", () => {
        mode = "flag";
        const t = create();
        t.onTouchStart(touchAt(0, 0), 1, 1);
        t.onTouchEnd(touchAt(0, 0), 1, 1);
        expect(onFlag).toHaveBeenCalledWith(1, 1);
        expect(onChord).not.toHaveBeenCalled();
    });

    test("a cancelled drag performs no action, matching the cleared preview", () => {
        const t = create();
        t.onTouchStart(touchAt(0, 0), 0, 0);
        t.onTouchMove(touchAt(50, 50));
        t.onTouchEnd(touchAt(50, 50), 0, 0);
        expect(onReveal).not.toHaveBeenCalled();
        expect(onChord).not.toHaveBeenCalled();
        expect(onFlag).not.toHaveBeenCalled();
    });

    test("releasing on a different cell than the one pressed does nothing", () => {
        const t = create();
        t.onTouchStart(touchAt(0, 0), 0, 0);
        t.onTouchEnd(touchAt(0, 0), 0, 1);
        expect(onReveal).not.toHaveBeenCalled();
    });

    test("no press or action while the board is not interactive", () => {
        interactive = false;
        const t = create();
        t.onTouchStart(touchAt(0, 0), 0, 0);
        expect(t.isPressed(0, 0, true)).toBe(false);
        t.onTouchEnd(touchAt(0, 0), 0, 0);
        expect(onReveal).not.toHaveBeenCalled();
    });
});
