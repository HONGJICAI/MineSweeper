import type { Board } from "@caiji-games/minesweeper-core";

type MouseAction = {
    leftDown: boolean;
    rightDown: boolean;
    position: { r: number; c: number };
};

type Options = {
    onReveal: (r: number, c: number) => void;
    onFlag: (r: number, c: number) => void;
    onChord: (r: number, c: number) => void;
    /** Board snapshot used to decide single-key chord on revealed numbers. */
    getBoard: () => Board;
    /** Whether mouse interactions are currently allowed (typically false during win/gameover). */
    isInteractive: () => boolean;
};

export function createDesktopMouseState(opts: Options) {
    let action = $state<MouseAction>({
        leftDown: false,
        rightDown: false,
        position: { r: -1, c: -1 },
    });

    function reset() {
        action.leftDown = false;
        action.rightDown = false;
        action.position = { r: -1, c: -1 };
    }

    function onMouseDown(e: MouseEvent, r: number, c: number) {
        if (!opts.isInteractive()) return;
        if (e.button === 0) {
            action.leftDown = true;
            action.position = { r, c };
        } else if (e.button === 2) {
            action.rightDown = true;
            action.position = { r, c };
        }
        e.stopPropagation();
    }

    // Drag-aim: while any button is held, moving the cursor onto a new cell
    // updates the press target so the visual preview and the eventual action
    // follow the cursor (classic Minesweeper behavior).
    function onMouseEnter(_e: MouseEvent, r: number, c: number) {
        if (!opts.isInteractive()) return;
        if (!action.leftDown && !action.rightDown) return;
        action.position = { r, c };
    }

    // True iff a left-only press on a revealed number should chord (i.e. the
    // source cell is a revealed numbered cell — adjacent flags decide whether
    // the chord actually opens anything; that's the logic layer's call).
    function isChordSource(r: number, c: number): boolean {
        const board = opts.getBoard();
        const cell = board[r]?.[c];
        return !!cell && cell.isRevealed && !cell.isMine && cell.adjacentMines > 0;
    }

    function onMouseUp(e: MouseEvent, r: number, c: number) {
        if (!opts.isInteractive()) {
            reset();
            return;
        }
        if (action.position.r === r && action.position.c === c) {
            if (action.leftDown && action.rightDown) {
                opts.onChord(r, c);
            } else if (action.leftDown && e.button === 0) {
                if (isChordSource(r, c)) opts.onChord(r, c);
                else opts.onReveal(r, c);
            } else if (action.rightDown && e.button === 2) {
                opts.onFlag(r, c);
            }
        }
        reset();
        e.stopPropagation();
    }

    /**
     * Visual "pressed" state for a cell. Triggers when:
     * - User is left-pressing this exact (unrevealed) cell, OR
     * - User is left+right-pressing this cell's neighbor (two-button chord preview), OR
     * - User is left-pressing this cell's neighbor that is a revealed number (single-key chord preview).
     */
    function isPressed(r: number, c: number, cellCanPress: boolean): boolean {
        if (!cellCanPress) return false;
        if (!action.leftDown) return false;
        if (action.position.r === r && action.position.c === c) return true;
        const dr = Math.abs(action.position.r - r);
        const dc = Math.abs(action.position.c - c);
        if (dr > 1 || dc > 1) return false;
        if (action.rightDown) return true;
        if (isChordSource(action.position.r, action.position.c)) return true;
        return false;
    }

    return {
        get action() { return action; },
        get isPressing() { return action.leftDown; },
        onMouseDown,
        onMouseUp,
        onMouseEnter,
        onLeave: reset,
        isPressed,
    };
}

export type DesktopMouseState = ReturnType<typeof createDesktopMouseState>;
