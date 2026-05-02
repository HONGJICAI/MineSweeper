import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameStatus, Position, UserActionDetail } from "../Game.types";

type ReplayState = {
    seed: string;
    actions: UserActionDetail[];
    current: number;
};

const REAL_TIME_SPEED = -1;
const DEFAULT_SPEED_MS = 500;

type Deps = {
    gameStatus: GameStatus;
    handleReset: () => void;
    handleCellClick: (r: number, c: number, seed?: string, replay?: boolean) => number;
    handleFlagCell: (r: number, c: number) => number;
    handleChordCell: (r: number, c: number) => number;
    addUserAction: (action: UserActionDetail) => void;
    setHighlightedCell: (cell?: Position) => void;
    onReplayStart?: () => void;
};

export function useReplayController({
    gameStatus,
    handleReset,
    handleCellClick,
    handleFlagCell,
    handleChordCell,
    addUserAction,
    setHighlightedCell,
    onReplayStart,
}: Deps) {
    const [pendingReplay, setPendingReplay] = useState<ReplayState | null>(null);
    const [autoPlaying, setAutoPlaying] = useState(false);
    const [showAutoPlayOverlay, setShowAutoPlayOverlay] = useState(false);
    const lastPlayedStepRef = useRef<number | null>(null);
    const speedRef = useRef<number>(DEFAULT_SPEED_MS);

    const replayTitle = useMemo(() => {
        if (!pendingReplay) return undefined;
        return `Replaying ${pendingReplay.current + 1}/${pendingReplay.actions.length}`;
    }, [pendingReplay]);

    useEffect(() => {
        if (!autoPlaying || !pendingReplay) return;
        if (gameStatus !== GameStatus.Init && gameStatus !== GameStatus.Gaming) return;

        if (pendingReplay.current >= pendingReplay.actions.length) {
            setPendingReplay(null);
            setHighlightedCell(undefined);
            lastPlayedStepRef.current = null;
            setShowAutoPlayOverlay(false);
            setAutoPlaying(false);
            return;
        }

        // Guard against re-dispatching the same step when other deps (e.g. board callbacks) change.
        if (lastPlayedStepRef.current === pendingReplay.current) return;

        const action = pendingReplay.actions[pendingReplay.current];
        const step = action.position;
        if (action.type === "reveal") {
            handleCellClick(step.r, step.c, pendingReplay.seed, true);
        } else if (action.type === "flag") {
            handleFlagCell(step.r, step.c);
        } else if (action.type === "chord") {
            handleChordCell(step.r, step.c);
        }
        setHighlightedCell(step);
        addUserAction(action);
        lastPlayedStepRef.current = pendingReplay.current;

        const delay = speedRef.current === REAL_TIME_SPEED ? action.time : speedRef.current;
        setTimeout(() => {
            setPendingReplay(prev => prev ? { ...prev, current: prev.current + 1 } : null);
        }, delay);
    }, [autoPlaying, pendingReplay, gameStatus, handleCellClick, handleFlagCell, handleChordCell, addUserAction, setHighlightedCell]);

    const onClickReplayButton = useCallback((seed: string, actions: UserActionDetail[]) => {
        handleReset();
        setShowAutoPlayOverlay(true);
        setPendingReplay({ seed, actions, current: 0 });
    }, [handleReset]);

    const onStartReplay = useCallback((speed: number) => {
        speedRef.current = speed;
        onReplayStart?.();
        setAutoPlaying(true);
    }, [onReplayStart]);

    const onCancelReplay = useCallback(() => {
        setShowAutoPlayOverlay(false);
        setAutoPlaying(false);
        setPendingReplay(null);
        lastPlayedStepRef.current = null;
    }, []);

    return {
        replayTitle,
        showAutoPlayOverlay,
        autoPlaying,
        onClickReplayButton,
        onStartReplay,
        onCancelReplay,
    };
}
