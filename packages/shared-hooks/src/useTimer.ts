import { useEffect, useRef, useState } from 'react';

/**
 * Hook for running an interval that cleans up automatically
 */
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void | undefined>(undefined);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }

    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

/**
 * Hook for detecting when user is idle
 */
export function useIdle(timeout: number = 5000): boolean {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimeout = () => {
      setIsIdle(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsIdle(true), timeout);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    resetTimeout();
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
    };
  }, [timeout]);

  return isIdle;
}
