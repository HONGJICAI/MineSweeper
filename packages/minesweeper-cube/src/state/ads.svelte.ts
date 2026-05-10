import {
    initialize,
    requestConsent,
    getConsentStatus,
    canRequestAds,
    loadBanner,
    loadInterstitial,
} from "tauri-plugin-admob-android-api";

// Google's universal test ad units. They never charge advertisers and never pay you, but always
// fill — perfect for development and CI. Real units replace these per-platform via env vars or a
// build-time substitution before Play upload.
const TEST_BANNER       = "ca-app-pub-3940256099942544/6300978111";
const TEST_INTERSTITIAL = "ca-app-pub-3940256099942544/1033173712";

// Show an interstitial every Nth completed game (Win or GameOver). Tuned conservatively — too
// frequent kills retention; too rare leaves money on the table. Revisit once we have install
// data.
const INTERSTITIAL_FREQUENCY = 3;

export function createAdsState() {
    // `available` flips to true only after a successful initialize() call. The plugin only ships
    // an Android implementation, so on desktop / web / iOS the init throws and the rest of this
    // module becomes inert no-ops. Avoids `if (isAndroid)` sprinkled everywhere in callers.
    let available = $state(false);
    let consentStatus = $state<"UNKNOWN" | "NOT_REQUIRED" | "REQUIRED" | "OBTAINED">("UNKNOWN");
    let bannerShown = $state(false);
    let gamesSinceLastInterstitial = 0;

    async function init() {
        try {
            await initialize();
            available = true;
        } catch {
            // Non-Android platforms (desktop / web). Silently disable.
            available = false;
            return;
        }
        try {
            consentStatus = await getConsentStatus();
            if (consentStatus === "REQUIRED") {
                await requestConsent();
                consentStatus = await getConsentStatus();
            }
        } catch {
            // Consent flow failure is recoverable — canRequestAds() handles fallback.
        }
    }

    async function showBanner() {
        if (!available || bannerShown) return;
        try {
            const ok = await canRequestAds();
            if (!ok.value) return;
            await loadBanner({ position: "bottom", adUnitId: TEST_BANNER });
            bannerShown = true;
        } catch {
            // Network / inventory miss — banner just doesn't appear, game continues.
        }
    }

    // Call from the Win/GameOver transition. Increments a counter; only actually shows once per
    // INTERSTITIAL_FREQUENCY games. The plugin's loadInterstitial() loads AND shows in a single
    // call, so there's a small (~0.5-2s) latency the player sees as a brief pause before the ad.
    async function maybeShowInterstitial() {
        if (!available) return;
        gamesSinceLastInterstitial++;
        if (gamesSinceLastInterstitial < INTERSTITIAL_FREQUENCY) return;
        try {
            const ok = await canRequestAds();
            if (!ok.value) return;
            await loadInterstitial({ adUnitId: TEST_INTERSTITIAL });
            gamesSinceLastInterstitial = 0;
        } catch {
            // Same as banner: silent fail, retry on next eligible game.
        }
    }

    return {
        get available() { return available; },
        get consentStatus() { return consentStatus; },
        get bannerShown() { return bannerShown; },
        init,
        showBanner,
        maybeShowInterstitial,
    };
}

export type AdsState = ReturnType<typeof createAdsState>;
