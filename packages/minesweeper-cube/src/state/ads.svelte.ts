import {
    initialize,
    requestConsent,
    showPrivacyOptionsForm,
    showBanner as showBannerCmd,
    hideBanner as hideBannerCmd,
    prepareInterstitial,
    showInterstitial,
    prepareRewarded,
    showRewarded,
    prepareAppOpen,
    showAppOpen,
} from "@caiji-games/tauri-plugin-admob-api";
import { persistedState } from "./persisted.ts";

// Google's universal test ad units. They never charge advertisers and never pay you, but always
// fill — used as the default so local dev and PR-smoke CI never accidentally hit real inventory
// (clicks on your own ads = AdMob policy violation = account ban).
//
// Real units are opt-in via env at build time:
//   VITE_ADMOB_BANNER       — your real banner ad unit id
//   VITE_ADMOB_INTERSTITIAL — your real interstitial ad unit id
//   VITE_ADMOB_REWARDED     — your real rewarded ad unit id
//   VITE_ADMOB_APP_OPEN     — your real app open ad unit id
// In CI these come from GitHub Secrets (see release-android.yml). When unset, the build falls
// back to test units and the resulting AAB still works for testing — just no revenue.
//
// The AdMob *App ID* (different from ad-unit IDs) is injected into AndroidManifest.xml at gradle
// build time via the ADMOB_APP_ID env / manifestPlaceholder — see app/build.gradle.kts. The
// plugin reads it from the manifest meta-data, not from this JS-side initialize() call.
const TEST_BANNER       = "ca-app-pub-3940256099942544/6300978111";
const TEST_INTERSTITIAL = "ca-app-pub-3940256099942544/1033173712";
const TEST_REWARDED     = "ca-app-pub-3940256099942544/5224354917";
const TEST_APP_OPEN     = "ca-app-pub-3940256099942544/9257395921";
const BANNER_AD_UNIT       = import.meta.env.VITE_ADMOB_BANNER       || TEST_BANNER;
const INTERSTITIAL_AD_UNIT = import.meta.env.VITE_ADMOB_INTERSTITIAL || TEST_INTERSTITIAL;
const REWARDED_AD_UNIT     = import.meta.env.VITE_ADMOB_REWARDED     || TEST_REWARDED;
const APP_OPEN_AD_UNIT     = import.meta.env.VITE_ADMOB_APP_OPEN     || TEST_APP_OPEN;

// Consent-testing knobs. The UMP consent form only appears for users in the EEA/UK/CH, so from
// anywhere else the only way to see it is to tell the SDK to pretend. Both must be set together —
// the geography override is ignored unless the device is registered as a test device.
//
//   VITE_ADMOB_DEBUG_GEOGRAPHY  1 = EEA, 2 = not EEA
//   VITE_ADMOB_TEST_DEVICE_ID   hashed device id, comma-separated for several
//   VITE_ADMOB_RESET_CONSENT    "1" to wipe the stored answer so the form shows again
//
// To get the hashed id: run once with only VITE_ADMOB_DEBUG_GEOGRAPHY set and read logcat — the
// UMP SDK prints "addTestDeviceHashedId("…")" telling you what to register. Leave all three
// unset in release builds; the release workflow never sets them.
const DEBUG_GEOGRAPHY = import.meta.env.VITE_ADMOB_DEBUG_GEOGRAPHY;
const TEST_DEVICE_IDS = import.meta.env.VITE_ADMOB_TEST_DEVICE_ID;
const CONSENT_DEBUG = {
    ...(DEBUG_GEOGRAPHY ? { debugGeography: Number(DEBUG_GEOGRAPHY) } : {}),
    ...(TEST_DEVICE_IDS ? { testDeviceHashedIds: String(TEST_DEVICE_IDS).split(",") } : {}),
    ...(import.meta.env.VITE_ADMOB_RESET_CONSENT === "1" ? { resetConsent: true } : {}),
};

// Show an interstitial every Nth completed game (Win or GameOver). Tuned conservatively — too
// frequent kills retention; too rare leaves money on the table. Revisit once we have install
// data.
const INTERSTITIAL_FREQUENCY = 3;

// Reward grants a 24h banner-free window. Sliding (not calendar-day) so users get the full
// amount regardless of when they watched or what timezone they're in. `Date.now()` is UTC ms so
// comparing two timestamps is timezone-independent and DST-safe — no need to manipulate dates.
const NO_BANNER_DURATION_MS = 24 * 60 * 60 * 1000;

// Cold-start App Open ad: how long to wait for the preload to settle before giving up. If the
// network is slow and the ad doesn't arrive within this window we silently skip this cold start
// — better than letting a fullscreen ad pop after the player has already started a game.
//
// Why 4s and not less: every prepareAppOpen() requires a fresh server round-trip (auction +
// tracking URL mint), not just a disk-cache read — even when creative assets are cached, the
// auction call alone is typically 500-1500ms, and SDK warm-up on cold start can push the
// realistic floor to 2-3s on a normal connection. 2s was too tight and missed most cold starts.
// 4s catches the vast majority without making the "no ad shown" path feel slow.
//
// Game UI does NOT block on this. App.svelte mounts the canvas synchronously and only awaits
// maybeShowAppOpen() inside a $effect — so the player sees the cube within ~500ms of launch
// and the ad (if any) pops on top of it 1-3s later.
const APP_OPEN_WAIT_MS = 4000;

export function createAdsState() {
    // `available` flips to true only after a successful initialize() call. The plugin only ships
    // an Android implementation, so everywhere else init throws and the rest of this module
    // becomes inert no-ops. Avoids `if (isAndroid)` sprinkled everywhere in callers.
    //
    // Each non-Android platform throws for its own reason: web has no Tauri `invoke` at all,
    // desktop hits the plugin's desktop stub which returns Err(UnsupportedPlatform) by design,
    // and iOS doesn't link (no Swift implementation). Note this file shouldn't even be loaded
    // off Android — vite aliases `$ads` to ads-noop.svelte.ts unless VITE_PLATFORM is "mobile"
    // — so a throw here means that aliasing didn't happen, which is worth noticing.
    //
    let available = $state(false);
    // Whether this user must be offered a way to revisit their consent choice. False for the
    // vast majority of players — the UMP SDK only sets it in regions that legally require it
    // (EEA/UK/CH), so any UI hanging off it has to be conditionally rendered, not always-on.
    let privacyOptionsRequired = $state(false);
    let bannerShown = $state(false);
    let rewardedReady = $state(false);
    let interstitialReady = false;
    let appOpenReady = false;
    let gamesSinceLastInterstitial = 0;

    // Timestamp (ms since epoch) until which the banner is suppressed. 0 = never granted /
    // expired. Persisted to localStorage so the reward survives app restarts within the 24h
    // window. Survives uninstall? No — that's fine, the user can just watch another ad.
    const noBannerUntil = persistedState<number>("ads:noBannerUntil", 0);
    // First-cold-start guard: on the very first launch ever we deliberately skip the App Open
    // ad so the player's first impression is the game, not an ad. Flag flips true on that first
    // attempt; every subsequent cold start qualifies.
    const hasLaunchedBefore = persistedState<boolean>("ads:hasLaunchedBefore", false);

    async function init() {
        // UMP consent first — the ads SDK must come up already knowing the consent state, so
        // this ordering is a hard requirement, not a preference.
        //
        // What this does and doesn't do: outside the EEA/UK/CH the SDK reports notRequired and no
        // form is ever shown, so this costs one fast no-op call. Inside those regions the form
        // appears on first launch. Either way `canRequestAds` is what decides whether we serve
        // ads — a user who declines personalization still gets (non-personalized) ads, so the
        // only case that turns ads off entirely is consent genuinely outstanding.
        try {
            const consent = await requestConsent(CONSENT_DEBUG);
            privacyOptionsRequired = consent.privacyOptionsRequired;
            console.log("[ads] consent:", consent);
            if (!consent.canRequestAds) {
                // Consent outstanding — no SDK init, no ad calls, and every method below stays a
                // no-op because `available` is false. Next cold start asks again.
                available = false;
                console.log("[ads] consent not granted — ads disabled for this session");
                return;
            }
        } catch (e) {
            // Plugin missing (non-Android) or the command threw. Fall through to initialize(),
            // which will fail the same way and flip us into the inert path below.
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
        // Warm all three formats in the background so the first show is instant. The new
        // plugin splits load (prepare) from show, which is what makes this preload-and-pop
        // pattern possible — the old plugin's loadInterstitial() did both in one blocking call.
        // App Open is warmed eagerly here so the cold-start show in App.svelte usually catches
        // a fully-loaded ad within the 2s wait window.
        void preloadInterstitial();
        void preloadRewarded();
        void preloadAppOpen();
    }

    async function preloadInterstitial() {
        if (!available || interstitialReady) return;
        try {
            await prepareInterstitial({ adUnitId: INTERSTITIAL_AD_UNIT });
            interstitialReady = true;
            console.log("[ads] interstitial preloaded");
        } catch (e) {
            console.warn("[ads] prepareInterstitial failed:", e);
        }
    }

    async function preloadRewarded() {
        if (!available || rewardedReady) return;
        try {
            await prepareRewarded({ adUnitId: REWARDED_AD_UNIT });
            rewardedReady = true;
            console.log("[ads] rewarded preloaded");
        } catch (e) {
            console.warn("[ads] prepareRewarded failed:", e);
        }
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

    // Cold-start App Open ad. Called once from App.svelte right after init resolves. Three
    // skip paths:
    //   1. First launch ever — the player has never seen the game, so an ad as the first thing
    //      would be a terrible first impression (and Google policy frowns on it). We flip the
    //      flag and skip; the next cold start will be eligible.
    //   2. Preload didn't settle within APP_OPEN_WAIT_MS — we'd rather lose this impression
    //      than pop a fullscreen ad in 5 seconds after the player has already started clicking
    //      cells.
    //   3. Plugin not available (non-Android platforms).
    // This is "cold-start only" by design — we don't listen to visibilitychange / app-foreground
    // events, so a player who backgrounds and returns will never see App Open. Trade-off:
    // simpler implementation and zero risk of interrupting a paused game, at the cost of fewer
    // impressions from heavy users.
    async function maybeShowAppOpen(): Promise<void> {
        if (!available) return;
        if (!hasLaunchedBefore.value) {
            hasLaunchedBefore.value = true;
            console.log("[ads] appOpen skip: first launch ever");
            return;
        }
        const deadline = Date.now() + APP_OPEN_WAIT_MS;
        while (!appOpenReady && Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 100));
        }
        if (!appOpenReady) {
            console.log("[ads] appOpen skip: preload didn't settle in", APP_OPEN_WAIT_MS, "ms");
            return;
        }
        try {
            const r = await showAppOpen();
            console.log("[ads] showAppOpen result:", r);
        } catch (e) {
            console.warn("[ads] showAppOpen failed:", e);
        }
        appOpenReady = false;
        void preloadAppOpen();
    }

    async function showBanner() {
        if (!available) { console.log("[ads] showBanner skip: not available"); return; }
        if (bannerShown) { console.log("[ads] showBanner skip: already shown"); return; }
        if (Date.now() < noBannerUntil.value) {
            console.log("[ads] showBanner skip: hidden until", new Date(noBannerUntil.value).toISOString());
            return;
        }
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

    // Call from the Win/GameOver transition. Increments a counter; only actually shows once per
    // INTERSTITIAL_FREQUENCY games. Pops the preloaded ad if ready (instant), otherwise skips
    // this round and kicks off a load so the *next* call lands an ad.
    async function maybeShowInterstitial() {
        if (!available) { console.log("[ads] interstitial skip: not available"); return; }
        gamesSinceLastInterstitial++;
        console.log("[ads] games since last interstitial:", gamesSinceLastInterstitial, "/", INTERSTITIAL_FREQUENCY);
        if (gamesSinceLastInterstitial < INTERSTITIAL_FREQUENCY) return;
        if (!interstitialReady) {
            console.log("[ads] interstitial skip: not preloaded — kicking off load for next time");
            void preloadInterstitial();
            return;
        }
        try {
            const r = await showInterstitial();
            console.log("[ads] showInterstitial result:", r);
            gamesSinceLastInterstitial = 0;
            interstitialReady = false;
        } catch (e) {
            console.warn("[ads] showInterstitial failed:", e);
            interstitialReady = false;
        }
        // Always re-warm after a show (success or fail) so the next trigger has inventory.
        void preloadInterstitial();
    }

    // Plays the rewarded ad; on successful completion (user watched to the end and Google
    // emitted a reward) grants a 24h banner-free window and immediately hides the live banner.
    // Returns true if the reward was granted, false if the ad didn't play, wasn't completed,
    // or failed. Callers use the boolean for toast / sheet-close UX.
    async function watchRewardedToHideBanner(): Promise<boolean> {
        if (!available) { console.log("[ads] rewarded skip: not available"); return false; }
        if (!rewardedReady) {
            console.log("[ads] rewarded skip: not preloaded — kicking off load for next time");
            void preloadRewarded();
            return false;
        }
        let granted = false;
        try {
            const r = await showRewarded();
            console.log("[ads] showRewarded result:", r);
            // Only credit when the plugin reports a reward — covers the case where the user
            // backed out of the ad before completion (shown=true but reward=undefined).
            if (r.shown && r.reward) {
                noBannerUntil.value = Date.now() + NO_BANNER_DURATION_MS;
                granted = true;
                if (bannerShown) {
                    try { await hideBannerCmd(); } catch (e) { console.warn("[ads] hideBanner failed:", e); }
                    bannerShown = false;
                }
            }
        } catch (e) {
            console.warn("[ads] showRewarded failed:", e);
        }
        rewardedReady = false;
        // Always re-warm so the next trigger has inventory, whether or not this one paid out.
        void preloadRewarded();
        return granted;
    }

    // Re-open the consent form so the user can change their mind. GDPR requires this entry point
    // to exist wherever consent was gathered. Returns false if there was nothing to show.
    async function openPrivacyOptions(): Promise<boolean> {
        if (!privacyOptionsRequired) {
            console.log("[ads] privacy options skip: not required in this region");
            return false;
        }
        try {
            const r = await showPrivacyOptionsForm();
            console.log("[ads] showPrivacyOptionsForm result:", r);
            // The user may have just withdrawn consent, which takes effect on the next cold
            // start (the SDK is already initialized for this session).
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
        get rewardedReady() { return rewardedReady; },
        get noBannerUntil() { return noBannerUntil.value; },
        get privacyOptionsRequired() { return privacyOptionsRequired; },
        init,
        openPrivacyOptions,
        showBanner,
        maybeShowInterstitial,
        maybeShowAppOpen,
        watchRewardedToHideBanner,
    };
}

export type AdsState = ReturnType<typeof createAdsState>;
