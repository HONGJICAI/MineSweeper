// No-op ads implementation for every build that is not Android: web, desktop, Steam and the
// Microsoft Store. vite.config.ts aliases `$ads` here whenever VITE_PLATFORM !== "mobile", so the
// AdMob plugin's JS never enters those bundles. The Rust side is scoped the same way — the plugin
// is an android-only dependency in src-tauri/Cargo.toml, so desktop binaries do not contain it at
// all (not even the stub implementation).
//
// Same shape as ads.svelte.ts so App.svelte compiles against either without changes.
export function createAdsState() {
    return {
        get available() { return false; },
        get bannerShown() { return false; },
        get privacyOptionsRequired() { return false; },
        init: async () => {},
        maybeShowAppOpen: async () => {},
        showBanner: async () => {},
        hideBanner: async () => {},
        openPrivacyOptions: async () => false,
    };
}

export type AdsState = ReturnType<typeof createAdsState>;
