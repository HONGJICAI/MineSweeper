// No-op ads implementation for builds without AdMob (web, desktop, future paid-Android variant).
// Same exported surface as ads.svelte.ts so App / HUD compile against either without changes —
// vite.config.ts aliases `$ads` to this file when VITE_PLATFORM=web. Bundling this file instead
// of the AdMob one means `tauri-plugin-admob-android-api` JS never enters the web bundle.

export function createAdsState() {
    return {
        get available() { return false; },
        get consentStatus() { return "UNKNOWN" as const; },
        get bannerShown() { return false; },
        init: async () => {},
        showBanner: async () => {},
        maybeShowInterstitial: async () => {},
    };
}

export type AdsState = ReturnType<typeof createAdsState>;
