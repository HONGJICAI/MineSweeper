import { GameStatus, type Position, type UserActionDetail } from "@caiji-games/minesweeper-core";

type ReplayQueue = {
    seed: string;
    actions: UserActionDetail[];
    current: number;
};

const REAL_TIME_SPEED = -1;
const DEFAULT_SPEED_MS = 500;

type Deps = {
    getGameStatus: () => GameStatus;
    reset: () => void;
    reveal: (r: number, c: number, seed?: string, replay?: boolean) => void;
    chord: (r: number, c: number) => void;
    toggleFlag: (r: number, c: number) => void;
    addUserAction: (action: UserActionDetail) => void;
    setHighlightedCell: (cell: Position | undefined) => void;
    onReplayStart?: () => void;
};

export function createReplayState(deps: Deps) {
    let queue = $state<ReplayQueue | null>(null);
    let autoPlaying = $state(false);
    let paused = $state(false);
    let showOverlay = $state(false);
    let lastPlayedStep: number | null = null;
    let speed = DEFAULT_SPEED_MS;

    const progress = $derived(
        queue ? { current: queue.current + 1, total: queue.actions.length } : null
    );

    // Drives the replay one action per pass. Re-runs whenever `queue.current` advances, and also
    // when `paused` flips — that is what makes pause/resume work without tracking elapsed time:
    // pausing tears the effect down (clearing the pending timer via the cleanup below), resuming
    // re-runs it, which skips re-applying the already-played action and just re-arms the timer.
    $effect(() => {
        if (!autoPlaying || paused || !queue) return;
        const status = deps.getGameStatus();
        if (status !== GameStatus.Init && status !== GameStatus.Gaming) return;

        if (queue.current >= queue.actions.length) {
            queue = null;
            deps.setHighlightedCell(undefined);
            lastPlayedStep = null;
            showOverlay = false;
            autoPlaying = false;
            return;
        }

        const action = queue.actions[queue.current];

        // Guarded so a resume (or any unrelated re-run) does not replay the same move twice.
        if (lastPlayedStep !== queue.current) {
            const step = action.position;
            if (action.type === "reveal") {
                deps.reveal(step.r, step.c, queue.seed, true);
            } else if (action.type === "flag") {
                deps.toggleFlag(step.r, step.c);
            } else if (action.type === "chord") {
                deps.chord(step.r, step.c);
            }
            deps.setHighlightedCell(step);
            deps.addUserAction(action);
            lastPlayedStep = queue.current;
        }

        // Resuming restarts the full delay for the current step rather than the remainder. Simpler
        // than tracking elapsed time, and imperceptible: the step has already been applied, this
        // only decides when the *next* one lands.
        const delay = speed === REAL_TIME_SPEED ? action.time : speed;
        const timer = setTimeout(() => {
            if (queue) queue = { ...queue, current: queue.current + 1 };
        }, delay);
        return () => clearTimeout(timer);
    });

    function open(seed: string, actions: UserActionDetail[]) {
        deps.reset();
        showOverlay = true;
        paused = false;
        queue = { seed, actions, current: 0 };
    }

    function start(s: number) {
        speed = s;
        deps.onReplayStart?.();
        paused = false;
        autoPlaying = true;
    }

    function togglePause() {
        if (!autoPlaying) return;
        paused = !paused;
    }

    function cancel() {
        showOverlay = false;
        autoPlaying = false;
        paused = false;
        queue = null;
        lastPlayedStep = null;
        deps.setHighlightedCell(undefined);
        deps.reset();
    }

    return {
        get progress() { return progress; },
        get showOverlay() { return showOverlay; },
        get autoPlaying() { return autoPlaying; },
        get paused() { return paused; },
        open,
        start,
        togglePause,
        cancel,
    };
}

export type ReplayState = ReturnType<typeof createReplayState>;
