// No-op ads implementation for builds without AdMob (web, desktop, future paid-Android variant).
// Same exported surface as ads.svelte.ts so App / HUD compile against either without changes —
// vite.config.ts aliases `$ads` to this file when VITE_PLATFORM!=="mobile". Bundling this file
// instead of the AdMob one means the `@caiji-games/tauri-plugin-admob-api` JS never enters the
// web bundle.

export function createAdsState() {
    return {
        get available() { return false; },
        get bannerShown() { return false; },
        get rewardedReady() { return false; },
        get noBannerUntil() { return 0; },
        // No ads here, so nothing was ever consented to and there is no form to re-open.
        get privacyOptionsRequired() { return false; },
        init: async () => {},
        openPrivacyOptions: async () => false,
        showBanner: async () => {},
        maybeShowInterstitial: async () => {},
        maybeShowAppOpen: async () => {},
        watchRewardedToHideBanner: async () => false,
    };
}

export type AdsState = ReturnType<typeof createAdsState>;
