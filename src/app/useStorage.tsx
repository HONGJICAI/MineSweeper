import { useEffect, useState } from 'react';

/**
 * Hook to wrap around useState that stores the value in the browser local/session storage.
 *
 * @param {any} initialValue the initial value to store
 * @param {string} key the key to store the value in local/session storage
 * @param {string} storageKind either 'local' or 'session' for what type of storage
 * @returns a stateful value (T | null), and a function to update it.
 */
function useStorage<T>(
    initialValue: T,
    key: string,
    storageKind: 'local' | 'session'
): [T | null, (val: T) => void] {
    const storageAvailable = typeof window !== 'undefined';
    const storage = storageAvailable
        ? storageKind === 'local'
            ? window.localStorage
            : window.sessionStorage
        : null;

    // null means not loaded yet
    const [storedValue, setStoredValue] = useState<T | null>(null);

    // Load from storage on mount or when key/storageKind changes
    useEffect(() => {
        if (!storageAvailable) {
            console.warn('Storage is not available in this environment.');
            return;
        }
        try {
            const item = storage?.getItem(key);
            if (item) {
                setStoredValue(JSON.parse(item));
            } else {
                setStoredValue(initialValue);
            }
        } catch {
            setStoredValue(initialValue);
        }
        // Listen for storage changes
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === key) {
                try {
                    setStoredValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
                } catch {
                    setStoredValue(initialValue);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key, storageKind, storageAvailable, storage]); // eslint-disable-line react-hooks/exhaustive-deps

    const setValue = (value: T) => {
        setStoredValue(value);
        if (storageAvailable && storage) {
            storage.setItem(key, JSON.stringify(value));
        }
    };

    return [storedValue, setValue];
}

/**
 * Hook to wrap around useState that stores the value in the browser local storage.
 *
 * @param {string} key the key to store the value in local storage
 * @param {any} initialValue the initial value to store
 * @returns a stateful value (T | null), and a function to update it.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    return useStorage(initialValue, key, 'local');
}

/**
 * Hook to wrap around useState that stores the value in the browser session storage.
 *
 * @param {string} key the key to store the value in session storage
 * @param {T} initialValue the initial value to store
 * @returns a stateful value (T | null), and a function to update it.
 */
export function useSessionStorage<T>(key: string, initialValue: T) {
    return useStorage(initialValue, key, 'session');
}