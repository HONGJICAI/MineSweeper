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

    return {
        get isPressing() { return start !== null && !start.cancelled; },
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        onTouchCancel,
    };
}

export type MobileTouchState = ReturnType<typeof createMobileTouchState>;
