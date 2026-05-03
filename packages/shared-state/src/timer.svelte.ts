// Reactive seconds counter that ticks at 1Hz while running. Idempotent start/stop, auto-stops
// on unmount of the calling component (the inner $effect's teardown handles that).
//
// Must be called from a reactive context (component setup or another factory called from one).
export function createTimerState() {
    let seconds = $state(0);
    let intervalId: ReturnType<typeof setInterval> | null = null;

    function start() {
        if (intervalId !== null) return;
        intervalId = setInterval(() => {
            seconds += 1;
        }, 1000);
    }

    function stop() {
        if (intervalId !== null) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function reset() {
        stop();
        seconds = 0;
    }

    $effect(() => {
        return () => stop();
    });

    return {
        get seconds() { return seconds; },
        start,
        stop,
        reset,
    };
}

export type TimerState = ReturnType<typeof createTimerState>;
