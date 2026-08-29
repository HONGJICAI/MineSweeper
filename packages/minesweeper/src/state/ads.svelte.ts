import {
    initialize,
    requestConsent,
    showPrivacyOptionsForm,
    showBanner as showBannerCmd,
    hideBanner as hideBannerCmd,
    prepareAppOpen,
    showAppOpen,
} from "@caiji-games/tauri-plugin-admob-api";

// Google's universal test ad units. They always fill, never charge advertisers and never pay you.
// Used as the default so local dev and CI never touch real inventory — clicking your own live ads
// is an AdMob policy violation. Real units are opt-in via env at build time:
//   VITE_ADMOB_BANNER    — real banner ad unit id
//   VITE_ADMOB_APP_OPEN  — real app open ad unit id
// The AdMob *App ID* (note the '~' separator, not '/') is a separate thing, injected into
// AndroidManifest.xml by gradle from the ADMOB_APP_ID env — see gen/android/app/build.gradle.kts.
// Leaving the unit vars unset while setting a real App ID is a useful combination: the consent
// form is then the real one configured in AdMob, but the ads themselves stay test ads.
const TEST_BANNER   = "ca-app-pub-3940256099942544/6300978111";
const TEST_APP_OPEN = "ca-app-pub-3940256099942544/9257395921";
const BANNER_AD_UNIT   = import.meta.env.VITE_ADMOB_BANNER   || TEST_BANNER;
const APP_OPEN_AD_UNIT = import.meta.env.VITE_ADMOB_APP_OPEN || TEST_APP_OPEN;

// Consent-testing knobs, only meaningful on a registered test device. `debugGeography: 1` forces
// the EEA flow from anywhere, which is the only way to see the form outside Europe.
const CONSENT_DEBUG = {
    ...(import.meta.env.VITE_ADMOB_DEBUG_GEOGRAPHY
        ? { debugGeography: Number(import.meta.env.VITE_ADMOB_DEBUG_GEOGRAPHY) } : {}),
    ...(import.meta.env.VITE_ADMOB_TEST_DEVICE_ID
        ? { testDeviceHashedIds: String(import.meta.env.VITE_ADMOB_TEST_DEVICE_ID).split(",") } : {}),
    ...(import.meta.env.VITE_ADMOB_RESET_CONSENT === "1" ? { resetConsent: true } : {}),
};

// How long to wait for the App Open preload before giving up on this cold start. Worth showing
// only while the player is still on the loading screen; once they are picking a difficulty,
// dropping a fullscreen ad on them is worse than showing nothing.
const APP_OPEN_WAIT_MS = 4000;

export function createAdsState() {
    // Flips true only after a successful initialize(). Everything below is inert until then, so
    // callers never need platform checks. On non-Android this file is not even bundled — vite
    // aliases `$ads` to ads-noop.svelte.ts unless VITE_PLATFORM is "mobile".
    let available = $state(false);
    // Only true where a consent or opt-out regime applies (EEA, UK, CH, and some US states). Any
    // UI hanging off it must be conditionally rendered — elsewhere there is no form to open.
    let privacyOptionsRequired = $state(false);
    let bannerShown = $state(false);
    let appOpenReady = false;

    async function init() {
        // UMP consent must complete before the ads SDK starts: it has to come up already knowing
        // the consent state. Outside regulated regions this is one fast no-op call and no form is
        // ever shown. A user who *declines* still gets ads, just non-personalised ones, so
        // canRequestAds is what decides whether we serve at all.
        try {
            const consent = await requestConsent(CONSENT_DEBUG);
            privacyOptionsRequired = consent.privacyOptionsRequired;
            console.log("[ads] consent:", consent);
            if (!consent.canRequestAds) {
                available = false;
                console.log("[ads] consent not granted — ads disabled for this session");
                return;
            }
        } catch (e) {
            // Plugin missing (non-Android) or the command threw. initialize() below fails the
            // same way and leaves us inert.
            console.warn("[ads] requestConsent() failed:", e);
        }
        try {
            await initialize({});
            available = true;
            console.log("[ads] initialize() OK");
        } catch (e) {
            available = false;
            console.warn("[ads] initialize() failed — assuming non-Android platform:", e);
            return;
        }
        void preloadAppOpen();
    }

    async function preloadAppOpen() {
        if (!available || appOpenReady) return;
        try {
            await prepareAppOpen({ adUnitId: APP_OPEN_AD_UNIT });
            appOpenReady = true;
            console.log("[ads] appOpen preloaded");
        } catch (e) {
            console.warn("[ads] prepareAppOpen failed:", e);
        }
    }

    // Cold-start App Open ad, shown before the player reaches the lobby. Unlike the cube app this
    // fires on the first launch too — the lobby is a menu rather than gameplay, so an ad in front
    // of it is far less intrusive than one in front of a running game.
    async function maybeShowAppOpen(): Promise<void> {
        if (!available) return;
        const deadline = Date.now() + APP_OPEN_WAIT_MS;
        while (!appOpenReady && Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 100));
        }
        if (!appOpenReady) {
            console.log("[ads] appOpen skip: preload did not settle in", APP_OPEN_WAIT_MS, "ms");
            return;
        }
        try {
            console.log("[ads] showAppOpen result:", await showAppOpen());
        } catch (e) {
            console.warn("[ads] showAppOpen failed:", e);
        }
        appOpenReady = false;
        void preloadAppOpen();
    }

    // Banner belongs to the lobby only. App.svelte drives this from the `view` state so it stays
    // hidden the whole time a game is on screen — a banner pinned under a minesweeper grid invites
    // mis-taps, and a mis-tap on a live ad is invalid traffic.
    async function showBanner() {
        if (!available || bannerShown) return;
        try {
            const r = await showBannerCmd({
                adUnitId: BANNER_AD_UNIT,
                position: "bottom",
                adSize: "BANNER",
            });
            console.log("[ads] showBanner result:", r);
            bannerShown = true;
        } catch (e) {
            console.warn("[ads] showBanner failed:", e);
        }
    }

    async function hideBanner() {
        if (!available || !bannerShown) return;
        try {
            await hideBannerCmd();
        } catch (e) {
            console.warn("[ads] hideBanner failed:", e);
        }
        // Cleared even when the call failed: leaving it true would block every later showBanner().
        bannerShown = false;
    }

    // Re-open the consent form so the user can change their choice. GDPR requires this entry point
    // wherever consent was gathered. Returns false when there was nothing to show.
    async function openPrivacyOptions(): Promise<boolean> {
        if (!privacyOptionsRequired) {
            console.log("[ads] privacy options skip: not required in this region");
            return false;
        }
        try {
            const r = await showPrivacyOptionsForm();
            console.log("[ads] showPrivacyOptionsForm result:", r);
            // The user may have just withdrawn consent, which takes effect on the next cold start.
            privacyOptionsRequired = r.privacyOptionsRequired;
            return r.shown;
        } catch (e) {
            console.warn("[ads] showPrivacyOptionsForm failed:", e);
            return false;
        }
    }

    return {
        get available() { return available; },
        get bannerShown() { return bannerShown; },
        get privacyOptionsRequired() { return privacyOptionsRequired; },
        init,
        maybeShowAppOpen,
        showBanner,
        hideBanner,
        openPrivacyOptions,
    };
}

export type AdsState = ReturnType<typeof createAdsState>;
