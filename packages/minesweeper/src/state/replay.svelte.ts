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
    let showOverlay = $state(false);
    let lastPlayedStep: number | null = null;
    let speed = DEFAULT_SPEED_MS;

    const title = $derived(
        queue ? `Replaying ${queue.current + 1}/${queue.actions.length}` : undefined
    );

    $effect(() => {
        if (!autoPlaying || !queue) return;
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

        if (lastPlayedStep === queue.current) return;

        const action = queue.actions[queue.current];
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

        const delay = speed === REAL_TIME_SPEED ? action.time : speed;
        setTimeout(() => {
            if (queue) queue = { ...queue, current: queue.current + 1 };
        }, delay);
    });

    function open(seed: string, actions: UserActionDetail[]) {
        deps.reset();
        showOverlay = true;
        queue = { seed, actions, current: 0 };
    }

    function start(s: number) {
        speed = s;
        deps.onReplayStart?.();
        autoPlaying = true;
    }

    function cancel() {
        showOverlay = false;
        autoPlaying = false;
        queue = null;
        lastPlayedStep = null;
        deps.setHighlightedCell(undefined);
        deps.reset();
    }

    return {
        get title() { return title; },
        get showOverlay() { return showOverlay; },
        get autoPlaying() { return autoPlaying; },
        open,
        start,
        cancel,
    };
}

export type ReplayState = ReturnType<typeof createReplayState>;
