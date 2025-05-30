import { useCallback } from "react";
import { useLocalStorage } from "./useStorage";
import { Difficulty } from "./Game.types";

export type PlayHistoryEntry = {
    result: "Win" | "Loss";
    time: number;
    difficulty: Difficulty;
    seed: string;
};
export type PlayHistory = PlayHistoryEntry & {
    date: string;
};

export function usePlayHistory() {
    const [playHistory, setPlayHistory] = useLocalStorage<PlayHistory[]>(
        "playHistory",
        []
    );

    const addPlayHistoryEntry = useCallback((entry: PlayHistoryEntry) => {
        if (playHistory === null) return;
        const date = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const newEntry = { ...entry, date };
        setPlayHistory([newEntry, ...playHistory]);
    }, [playHistory, setPlayHistory]);

    const clearPlayHistory = useCallback(() => {
        setPlayHistory([]);
    }, [setPlayHistory]);

    return { playHistory, addPlayHistoryEntry, clearPlayHistory };
}