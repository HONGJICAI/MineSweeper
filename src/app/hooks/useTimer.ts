import { useState, useRef, useEffect, useCallback } from 'react';

export function useTimer() {
    const [timerState, setTimerState] = useState(0);
    const timerRef = useRef<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isRunningRef = useRef(false);

    const startTimer = useCallback(() => {
        if (!isRunningRef.current) {
            isRunningRef.current = true;
            intervalRef.current = setInterval(() => {
                setTimerState((t) => t + 1);
                timerRef.current += 1;
            }, 1000);
        }
    }, []);


    const stopTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            isRunningRef.current = false;
        }
    }, []);

    const resetTimer = useCallback(() => {
        stopTimer();
        setTimerState(0);
        timerRef.current = 0;
    }, [stopTimer]);

    useEffect(() => {
        return () => {
            stopTimer();
        };
    }, [stopTimer]);

    return {
        timerState,
        timerRef,
        startTimer,
        stopTimer,
        resetTimer,
    };
}