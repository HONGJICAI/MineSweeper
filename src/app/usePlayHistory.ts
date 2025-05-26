import { useState, useCallback } from "react";

type Difficulty = "easy" | "medium" | "hard";
type PlayHistoryEntry = {
    result: "Win" | "Loss";
    time: number;
    difficulty: Difficulty;
};
type PlayHistory = PlayHistoryEntry & {
    date: string;
};

export function usePlayHistory() {
    const [playHistory, setPlayHistory] = useState<PlayHistory[]>([]);

    const addPlayHistoryEntry = useCallback((entry: PlayHistoryEntry) => {
        const date = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
        const newEntry = { ...entry, date };
        setPlayHistory((history) => [newEntry, ...history]);
    }, []);

    return { playHistory, addPlayHistoryEntry };
}