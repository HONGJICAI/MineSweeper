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
        setPlayHistory([entry, ...playHistory]);
    }, [playHistory, setPlayHistory]);

    const clearPlayHistory = useCallback(() => {
        setPlayHistory([]);
    }, [setPlayHistory]);

    return { playHistory, addPlayHistoryEntry, clearPlayHistory };
}