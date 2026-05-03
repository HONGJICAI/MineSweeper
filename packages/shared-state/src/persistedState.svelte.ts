// Reactive state backed by localStorage. Read/write via `.value`. Cross-tab updates via the
// `storage` event are picked up automatically.
//
// Must be called from a reactive context (component setup or another factory called from one),
// since it uses `$effect` to persist on change.
//
// Key namespacing: each app should call `createPersistedState("my-app:")` once and use the
// returned function for all keys, so apps sharing localStorage don't collide. The bare
// `persistedState` export is the unprefixed default.

function load<T>(fullKey: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = window.localStorage.getItem(fullKey);
        if (raw === null) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export type PersistedState<T> = {
    value: T;
};

export function createPersistedState(prefix = ""): <T>(key: string, initial: T) => PersistedState<T> {
    return function persistedStateFn<T>(key: string, initial: T): PersistedState<T> {
        const fullKey = prefix + key;
        let value = $state<T>(load(fullKey, initial));

        $effect(() => {
            // JSON.stringify walks every nested property of the deep-state proxy, so any mutation
            // anywhere in the tree triggers a write.
            const json = JSON.stringify(value);
            try {
                window.localStorage.setItem(fullKey, json);
            } catch (e) {
                console.warn(`Failed to persist '${fullKey}':`, e);
            }
        });

        if (typeof window !== "undefined") {
            $effect(() => {
                const handler = (e: StorageEvent) => {
                    if (e.key !== fullKey) return;
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
    };
}

export const persistedState = createPersistedState();
