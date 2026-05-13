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
            console.log("[ads] initialize() OK");
        } catch (e) {
            available = false;
            console.warn("[ads] initialize() failed — assuming non-Android platform:", e);
            return;
        }
        try {
            consentStatus = await getConsentStatus();
            console.log("[ads] consent status (initial):", consentStatus);
            // UNKNOWN = SDK hasn't queried the consent server yet. Always call requestConsent to
            // trigger that query; the status then settles to NOT_REQUIRED (non-EU) or REQUIRED
            // (EU). Without this, canRequestAds() returns false and ads never load.
            if (consentStatus === "UNKNOWN" || consentStatus === "REQUIRED") {
                await requestConsent();
                consentStatus = await getConsentStatus();
                console.log("[ads] consent status (after request):", consentStatus);
            }
        } catch (e) {
            console.warn("[ads] consent flow failed (recoverable):", e);
        }
    }

    async function showBanner() {
        if (!available) { console.log("[ads] showBanner skip: not available"); return; }
        if (bannerShown) { console.log("[ads] showBanner skip: already shown"); return; }
        try {
            const ok = await canRequestAds();
            console.log("[ads] canRequestAds (banner):", ok);
            if (!ok.value) return;
            const r = await loadBanner({ position: "bottom", adUnitId: TEST_BANNER });
            console.log("[ads] loadBanner result:", r);
            bannerShown = true;
        } catch (e) {
            console.warn("[ads] loadBanner failed:", e);
        }
    }

    // Call from the Win/GameOver transition. Increments a counter; only actually shows once per
    // INTERSTITIAL_FREQUENCY games. The plugin's loadInterstitial() loads AND shows in a single
    // call, so there's a small (~0.5-2s) latency the player sees as a brief pause before the ad.
    async function maybeShowInterstitial() {
        if (!available) { console.log("[ads] interstitial skip: not available"); return; }
        gamesSinceLastInterstitial++;
        console.log("[ads] games since last interstitial:", gamesSinceLastInterstitial, "/", INTERSTITIAL_FREQUENCY);
        if (gamesSinceLastInterstitial < INTERSTITIAL_FREQUENCY) return;
        try {
            const ok = await canRequestAds();
            console.log("[ads] canRequestAds (interstitial):", ok);
            if (!ok.value) return;
            const r = await loadInterstitial({ adUnitId: TEST_INTERSTITIAL });
            console.log("[ads] loadInterstitial result:", r);
            gamesSinceLastInterstitial = 0;
        } catch (e) {
            console.warn("[ads] loadInterstitial failed:", e);
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
