function load<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

/**
 * Reactive state backed by localStorage. Read/write `.value`.
 * Cross-tab updates via the `storage` event are picked up automatically.
 *
 * Note: must be called from a reactive context (component setup or another
 * factory function called from one), since it uses `$effect` to persist.
 */
export function persistedState<T>(key: string, initial: T) {
    let value = $state<T>(load(key, initial));

    $effect(() => {
        // Reading `value` (and JSON.stringify walks every nested property of the
        // deep-state proxy) tracks all sub-changes — any mutation triggers a write.
        const t0 = performance.now();
        const json = JSON.stringify(value);
        try {
            window.localStorage.setItem(key, json);
            const elapsed = performance.now() - t0;
            if (elapsed > 200) {
                console.warn(`[storage:${key}] slow write ${elapsed.toFixed(1)}ms size=${(json.length / 1024).toFixed(1)}KB`);
            }
        } catch (e) {
            console.warn(`Failed to persist '${key}':`, e);
        }
    });

    if (typeof window !== "undefined") {
        $effect(() => {
            const handler = (e: StorageEvent) => {
                if (e.key !== key) return;
                try {
                    value = e.newValue ? JSON.parse(e.newValue) : initial;
                } catch {
                    value = initial;
                }
            };
            window.addEventListener("storage", handler);
            return () => window.removeEventListener("storage", handler);
        });
    }

    return {
        get value() { return value; },
        set value(v: T) { value = v; },
    };
}

export type PersistedState<T> = ReturnType<typeof persistedState<T>>;
