import type { Board } from "@caiji-games/minesweeper-core";

const DRAG_THRESHOLD_PX = 10;

type TouchStart = {
    r: number;
    c: number;
    x: number;
    y: number;
    cancelled: boolean;
};

export type MobileMode = "reveal" | "flag";

type Options = {
    onReveal: (r: number, c: number) => void;
    onFlag: (r: number, c: number) => void;
    onChord: (r: number, c: number) => void;
    getBoard: () => Board;
    getMode: () => MobileMode;
    isInteractive: () => boolean;
};

export function createMobileTouchState(opts: Options) {
    let start = $state<TouchStart | null>(null);

    function onTouchStart(e: TouchEvent, r: number, c: number) {
        if (!opts.isInteractive()) return;
        const t = e.touches[0];
        start = {
            r,
            c,
            x: t?.clientX ?? 0,
            y: t?.clientY ?? 0,
            cancelled: false,
        };
    }

    function onTouchMove(e: TouchEvent) {
        if (!start || start.cancelled) return;
        const t = e.touches[0];
        if (!t) return;
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        if (dx * dx + dy * dy > DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
            start.cancelled = true;
        }
    }

    function onTouchEnd(e: TouchEvent, r: number, c: number) {
        const captured = start;
        start = null;
        if (!opts.isInteractive()) return;
        if (!captured || captured.cancelled) return;
        if (captured.r !== r || captured.c !== c) return;

        // Suppress synthetic mouse events that fire after a tap on touch devices.
        e.preventDefault();

        const board = opts.getBoard();
        const mode = opts.getMode();
        if (mode === "flag") {
            opts.onFlag(r, c);
        } else if (board[r][c].isRevealed) {
            opts.onChord(r, c);
        } else {
            opts.onReveal(r, c);
        }
    }

    function onTouchCancel() {
        start = null;
    }

    // A revealed number is a chord source: releasing on it tries to open its neighbours. Mirrors
    // the same-named helper in desktopMouse so both inputs preview identically. Zero-adjacency
    // cells are excluded because their neighbours are already revealed by the flood fill, so
    // there would be nothing to press anyway.
    function isChordSource(r: number, c: number): boolean {
        const cell = opts.getBoard()[r]?.[c];
        return !!cell && cell.isRevealed && !cell.isMine && cell.adjacentMines > 0;
    }

    /**
     * Visual "pressed" state for a cell, the touch counterpart of desktopMouse.isPressed. True when:
     * - this is the cell being touched, or
     * - the touch is on a neighbouring revealed number and we are in reveal mode, i.e. releasing
     *   would chord and open this cell.
     *
     * Deliberately false in flag mode: releasing there places a flag on the touched cell and never
     * touches its neighbours, so previewing them would promise something that will not happen.
     * Also false once the touch has been dragged past the cancel threshold, which is what makes
     * "press, slide off, release" back out of an action visibly rather than silently.
     */
    function isPressed(r: number, c: number, cellCanPress: boolean): boolean {
        if (!cellCanPress) return false;
        if (!start || start.cancelled) return false;
        if (start.r === r && start.c === c) return true;
        if (opts.getMode() !== "reveal") return false;
        if (Math.abs(start.r - r) > 1 || Math.abs(start.c - c) > 1) return false;
        return isChordSource(start.r, start.c);
    }

    return {
        get isPressing() { return start !== null && !start.cancelled; },
        isPressed,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onTouchCancel,
    };
}

export type MobileTouchState = ReturnType<typeof createMobileTouchState>;
