import { useCallback } from "react";
import { useLocalStorage } from "./useStorage";
import { PlayHistory } from "../Game.types";


export function usePlayHistory() {
    const [playHistory, setPlayHistory] = useLocalStorage<PlayHistory[]>(
        "playHistory",
        []
    );

    const addPlayHistoryEntry = useCallback((entry: PlayHistory) => {
        if (playHistory === null) return;
        for (let i = 0; i + 1 < entry.actions.length; i++) {
            entry.actions[i].time = entry.actions[i + 1].time - entry.actions[i].time;
        }
        entry.actions[entry.actions.length - 1].time = 0; // Last action has no time difference
        setPlayHistory([entry, ...playHistory]);
    }, [playHistory, setPlayHistory]);

    const clearPlayHistory = useCallback(() => {
        setPlayHistory([]);
    }, [setPlayHistory]);

    return { playHistory, addPlayHistoryEntry, clearPlayHistory };
}