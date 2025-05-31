import { useState, useEffect, useCallback, useRef } from 'react';

// Global store to hold singleton states
const globalStore = new Map<string, any>();
const listeners = new Map<string, Set<() => void>>();

/**
 * Custom hook that creates a singleton state shared across all component instances
 * @param key - Unique identifier for the singleton state
 * @param initialValue - Initial value for the state (only used if state doesn't exist)
 * @returns [state, setState] - Similar to useState but shared globally
 */
export function useSingletonState<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize the global state if it doesn't exist
  if (!globalStore.has(key)) {
    const value = typeof initialValue === 'function' 
      ? (initialValue as () => T)() 
      : initialValue;
    globalStore.set(key, value);
    listeners.set(key, new Set());
  }

  // Local state to trigger re-renders
  const [, forceUpdate] = useState({});
  const isMountedRef = useRef(true);

  // Get the current value
  const currentValue = globalStore.get(key) as T;

  // Subscribe to changes
  useEffect(() => {
    const listenersSet = listeners.get(key)!;
    const updateListener = () => {
      if (isMountedRef.current) {
        forceUpdate({});
      }
    };

    listenersSet.add(updateListener);

    return () => {
      isMountedRef.current = false;
      listenersSet.delete(updateListener);
      
      // Clean up if no more listeners
      if (listenersSet.size === 0) {
        listeners.delete(key);
        // Optionally keep the state in memory
        // globalStore.delete(key);
      }
    };
  }, [key]);

  // Setter function
  const setState = useCallback((value: T | ((prev: T) => T)) => {
    const newValue = typeof value === 'function'
      ? (value as (prev: T) => T)(globalStore.get(key) as T)
      : value;
    
    globalStore.set(key, newValue);
    
    // Notify all listeners
    const listenersSet = listeners.get(key);
    if (listenersSet) {
      listenersSet.forEach(listener => listener());
    }
  }, [key]);

  return [currentValue, setState];
}

/**
 * Utility function to clear a singleton state
 * @param key - The key of the singleton state to clear
 */
export function clearSingletonState(key: string): void {
  globalStore.delete(key);
  const listenersSet = listeners.get(key);
  if (listenersSet) {
    listenersSet.forEach(listener => listener());
    listeners.delete(key);
  }
}

/**
 * Utility function to clear all singleton states
 */
export function clearAllSingletonStates(): void {
  const keys = Array.from(globalStore.keys());
  keys.forEach(key => clearSingletonState(key));
}