type MouseAction = {
    leftDown: boolean;
    rightDown: boolean;
    position: { r: number; c: number };
};

type Options = {
    onReveal: (r: number, c: number) => void;
    onFlag: (r: number, c: number) => void;
    onChord: (r: number, c: number) => void;
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

    function onMouseUp(e: MouseEvent, r: number, c: number) {
        if (!opts.isInteractive()) {
            reset();
            return;
        }
        if (action.position.r === r && action.position.c === c) {
            if (action.leftDown && action.rightDown) {
                opts.onChord(r, c);
            } else if (action.leftDown && e.button === 0) {
                opts.onReveal(r, c);
            } else if (action.rightDown && e.button === 2) {
                opts.onFlag(r, c);
            }
        }
        reset();
        e.stopPropagation();
    }

    /**
     * Visual "pressed" state for a cell. Triggers when:
     * - User is left-pressing this exact cell, OR
     * - User is left+right-pressing this cell's neighbor (chord preview).
     */
    function isPressed(r: number, c: number, cellCanPress: boolean): boolean {
        if (!cellCanPress) return false;
        if (!action.leftDown) return false;
        if (action.position.r === r && action.position.c === c) return true;
        if (
            action.rightDown &&
            Math.abs(action.position.r - r) <= 1 &&
            Math.abs(action.position.c - c) <= 1
        ) {
            return true;
        }
        return false;
    }

    return {
        get action() { return action; },
        onMouseDown,
        onMouseUp,
        onLeave: reset,
        isPressed,
    };
}

export type DesktopMouseState = ReturnType<typeof createDesktopMouseState>;
