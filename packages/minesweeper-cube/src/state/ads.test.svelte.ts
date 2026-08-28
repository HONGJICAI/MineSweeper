import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { flushSync } from "svelte";

// All plugin entry points are mocked. Each test rewrites the implementations via
// vi.mocked(...).mockImplementation / mockResolvedValue / mockRejectedValue to drive the
// success / failure / not-loaded paths.
vi.mock("@caiji-games/tauri-plugin-admob-api", () => ({
    initialize: vi.fn(),
    requestConsent: vi.fn(),
    showPrivacyOptionsForm: vi.fn(),
    showBanner: vi.fn(),
    hideBanner: vi.fn(),
    prepareInterstitial: vi.fn(),
    showInterstitial: vi.fn(),
    prepareRewarded: vi.fn(),
    showRewarded: vi.fn(),
    prepareAppOpen: vi.fn(),
    showAppOpen: vi.fn(),
}));

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
import { createAdsState, type AdsState } from "./ads.svelte.ts";

// Mirrors of the constants in ads.svelte.ts. Kept in sync by hand — change them there, change
// them here. Asserting the exact numeric values doubles as a guard against silent tweaks.
const INTERSTITIAL_FREQUENCY = 3;
const NO_BANNER_DURATION_MS = 24 * 60 * 60 * 1000;
const APP_OPEN_WAIT_MS = 4000;

// Consent state every non-consent test runs under: nothing to ask, ads allowed. This is what a
// player outside the EEA/UK/CH gets, i.e. the overwhelmingly common case. The consent-specific
// describe below overrides it per test.
const CONSENT_OK = {
    status: "notRequired" as const,
    canRequestAds: true,
    privacyOptionsRequired: false,
};

function resetPluginMocks() {
    vi.mocked(initialize).mockReset();
    vi.mocked(requestConsent).mockReset();
    vi.mocked(requestConsent).mockResolvedValue(CONSENT_OK);
    vi.mocked(showPrivacyOptionsForm).mockReset();
    vi.mocked(showBannerCmd).mockReset();
    vi.mocked(hideBannerCmd).mockReset();
    vi.mocked(prepareInterstitial).mockReset();
    vi.mocked(showInterstitial).mockReset();
    vi.mocked(prepareRewarded).mockReset();
    vi.mocked(showRewarded).mockReset();
    vi.mocked(prepareAppOpen).mockReset();
    vi.mocked(showAppOpen).mockReset();
}

function createInRoot(): { ads: AdsState; cleanup: () => void } {
    let ads!: AdsState;
    const cleanup = $effect.root(() => {
        ads = createAdsState();
    });
    return { ads, cleanup };
}

// `init()` kicks off three preload calls with `void`. They resolve on the microtask queue, so
// we need to flush microtasks (without advancing fake timers) before asserting flags.
async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}

describe("createAdsState — initial state", () => {
    beforeEach(() => {
        localStorage.clear();
        resetPluginMocks();
    });

    test("starts unavailable, no banner, no rewarded", () => {
        const { ads, cleanup } = createInRoot();
        expect(ads.available).toBe(false);
        expect(ads.bannerShown).toBe(false);
        expect(ads.rewardedReady).toBe(false);
        expect(ads.noBannerUntil).toBe(0);
        cleanup();
    });
});

describe("consent (UMP / GDPR)", () => {
    beforeEach(() => {
        localStorage.clear();
        resetPluginMocks();
    });

    test("consent runs before the SDK init — ordering is a hard requirement", async () => {
        const calls: string[] = [];
        vi.mocked(requestConsent).mockImplementation(async () => {
            calls.push("consent");
            return CONSENT_OK;
        });
        vi.mocked(initialize).mockImplementation(async () => {
            calls.push("initialize");
            return undefined as never;
        });

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        expect(calls).toEqual(["consent", "initialize"]);
        cleanup();
    });

    test("canRequestAds=false: SDK never initializes and everything stays inert", async () => {
        vi.mocked(requestConsent).mockResolvedValue({
            status: "required",
            canRequestAds: false,
            privacyOptionsRequired: true,
        });

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        expect(initialize).not.toHaveBeenCalled();
        expect(ads.available).toBe(false);
        expect(prepareInterstitial).not.toHaveBeenCalled();
        expect(prepareRewarded).not.toHaveBeenCalled();
        expect(prepareAppOpen).not.toHaveBeenCalled();
        // Still surfaced, so the settings entry point renders even with ads switched off.
        expect(ads.privacyOptionsRequired).toBe(true);
        cleanup();
    });

    test("declining personalization still serves ads (canRequestAds stays true)", async () => {
        // The case people get wrong: "obtained" with personalization refused is still a green
        // light — the user gets non-personalized ads, not zero ads.
        vi.mocked(requestConsent).mockResolvedValue({
            status: "obtained",
            canRequestAds: true,
            privacyOptionsRequired: true,
        });
        vi.mocked(initialize).mockResolvedValue(undefined as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        expect(ads.available).toBe(true);
        expect(ads.privacyOptionsRequired).toBe(true);
        cleanup();
    });

    test("consent call throwing doesn't block init (plugin missing / non-Android)", async () => {
        vi.mocked(requestConsent).mockRejectedValue(new Error("not implemented"));
        vi.mocked(initialize).mockResolvedValue(undefined as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        expect(initialize).toHaveBeenCalledTimes(1);
        expect(ads.available).toBe(true);
        cleanup();
    });

    test("openPrivacyOptions is a no-op where the region doesn't require it", async () => {
        vi.mocked(initialize).mockResolvedValue(undefined as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        expect(ads.privacyOptionsRequired).toBe(false);
        await expect(ads.openPrivacyOptions()).resolves.toBe(false);
        expect(showPrivacyOptionsForm).not.toHaveBeenCalled();
        cleanup();
    });

    test("openPrivacyOptions shows the form and picks up a withdrawn requirement", async () => {
        vi.mocked(requestConsent).mockResolvedValue({
            status: "obtained",
            canRequestAds: true,
            privacyOptionsRequired: true,
        });
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(showPrivacyOptionsForm).mockResolvedValue({
            shown: true,
            status: "required",
            canRequestAds: false,
            privacyOptionsRequired: false,
        });

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        await expect(ads.openPrivacyOptions()).resolves.toBe(true);
        flushSync();
        expect(showPrivacyOptionsForm).toHaveBeenCalledTimes(1);
        expect(ads.privacyOptionsRequired).toBe(false);
        // Withdrawal only takes effect next cold start — this session keeps its live SDK.
        expect(ads.available).toBe(true);
        cleanup();
    });

    test("openPrivacyOptions swallows a form failure", async () => {
        vi.mocked(requestConsent).mockResolvedValue({
            status: "obtained",
            canRequestAds: true,
            privacyOptionsRequired: true,
        });
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(showPrivacyOptionsForm).mockRejectedValue(new Error("form unavailable"));

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        await expect(ads.openPrivacyOptions()).resolves.toBe(false);
        // Requirement unchanged, so the button stays available for a retry.
        expect(ads.privacyOptionsRequired).toBe(true);
        cleanup();
    });
});

describe("init()", () => {
    beforeEach(() => {
        localStorage.clear();
        resetPluginMocks();
    });

    test("on success: flips available and triggers all three preloads", async () => {
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        expect(ads.available).toBe(true);
        expect(prepareInterstitial).toHaveBeenCalledTimes(1);
        expect(prepareRewarded).toHaveBeenCalledTimes(1);
        expect(prepareAppOpen).toHaveBeenCalledTimes(1);
        expect(ads.rewardedReady).toBe(true);
        cleanup();
    });

    test("on init failure (non-Android platform): stays unavailable, no preloads", async () => {
        vi.mocked(initialize).mockRejectedValue(new Error("not implemented"));

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        expect(ads.available).toBe(false);
        expect(prepareInterstitial).not.toHaveBeenCalled();
        expect(prepareRewarded).not.toHaveBeenCalled();
        expect(prepareAppOpen).not.toHaveBeenCalled();
        cleanup();
    });

    test("preload failures don't crash init or mark formats ready", async () => {
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockRejectedValue(new Error("no fill"));
        vi.mocked(prepareRewarded).mockRejectedValue(new Error("no fill"));
        vi.mocked(prepareAppOpen).mockRejectedValue(new Error("no fill"));

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        expect(ads.available).toBe(true);
        expect(ads.rewardedReady).toBe(false);
        cleanup();
    });
});

describe("showBanner()", () => {
    beforeEach(() => {
        localStorage.clear();
        resetPluginMocks();
    });

    test("skips when not available", async () => {
        const { ads, cleanup } = createInRoot();
        await ads.showBanner();
        expect(showBannerCmd).not.toHaveBeenCalled();
        expect(ads.bannerShown).toBe(false);
        cleanup();
    });

    test("shows once and flips bannerShown; second call is a no-op", async () => {
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);
        vi.mocked(showBannerCmd).mockResolvedValue({ shown: true } as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        await ads.showBanner();
        expect(showBannerCmd).toHaveBeenCalledTimes(1);
        expect(showBannerCmd).toHaveBeenCalledWith(expect.objectContaining({
            position: "bottom",
            adSize: "BANNER",
        }));
        expect(ads.bannerShown).toBe(true);

        await ads.showBanner();
        expect(showBannerCmd).toHaveBeenCalledTimes(1);
        cleanup();
    });

    test("skips while inside the noBannerUntil reward window", async () => {
        // Seed a future noBannerUntil before construction so the reactive state picks it up.
        const future = Date.now() + 60 * 60 * 1000;
        localStorage.setItem("minesweeper-cube:ads:noBannerUntil", JSON.stringify(future));

        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        expect(ads.noBannerUntil).toBe(future);

        await ads.showBanner();
        expect(showBannerCmd).not.toHaveBeenCalled();
        expect(ads.bannerShown).toBe(false);
        cleanup();
    });

    test("shows again once the reward window has expired", async () => {
        const past = Date.now() - 1;
        localStorage.setItem("minesweeper-cube:ads:noBannerUntil", JSON.stringify(past));

        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);
        vi.mocked(showBannerCmd).mockResolvedValue({ shown: true } as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        await ads.showBanner();
        expect(showBannerCmd).toHaveBeenCalledTimes(1);
        cleanup();
    });

    test("plugin throw leaves bannerShown false (safe to retry)", async () => {
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);
        vi.mocked(showBannerCmd).mockRejectedValue(new Error("network"));

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        await ads.showBanner();
        expect(showBannerCmd).toHaveBeenCalledTimes(1);
        expect(ads.bannerShown).toBe(false);
        cleanup();
    });
});

describe("maybeShowInterstitial()", () => {
    beforeEach(() => {
        localStorage.clear();
        resetPluginMocks();
    });

    test("skips when not available", async () => {
        const { ads, cleanup } = createInRoot();
        await ads.maybeShowInterstitial();
        expect(showInterstitial).not.toHaveBeenCalled();
        cleanup();
    });

    test(`only fires on the ${INTERSTITIAL_FREQUENCY}th completed game`, async () => {
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);
        vi.mocked(showInterstitial).mockResolvedValue({ shown: true } as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        for (let i = 1; i < INTERSTITIAL_FREQUENCY; i++) {
            await ads.maybeShowInterstitial();
            expect(showInterstitial).not.toHaveBeenCalled();
        }
        await ads.maybeShowInterstitial();
        expect(showInterstitial).toHaveBeenCalledTimes(1);
        cleanup();
    });

    test("counter resets after a successful show", async () => {
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);
        vi.mocked(showInterstitial).mockResolvedValue({ shown: true } as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        for (let i = 0; i < INTERSTITIAL_FREQUENCY; i++) await ads.maybeShowInterstitial();
        expect(showInterstitial).toHaveBeenCalledTimes(1);
        await flushMicrotasks();

        // Need a fresh preload to land — re-warm was scheduled with `void`.
        for (let i = 0; i < INTERSTITIAL_FREQUENCY; i++) await ads.maybeShowInterstitial();
        expect(showInterstitial).toHaveBeenCalledTimes(2);
        cleanup();
    });

    test("when preload pending: skips and kicks off a fresh load", async () => {
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        // Interstitial preload fails so interstitialReady stays false.
        vi.mocked(prepareInterstitial).mockRejectedValue(new Error("no fill"));
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        const preloadCallsAfterInit = vi.mocked(prepareInterstitial).mock.calls.length;

        for (let i = 0; i < INTERSTITIAL_FREQUENCY; i++) await ads.maybeShowInterstitial();
        expect(showInterstitial).not.toHaveBeenCalled();
        // The skip path triggers exactly one additional preload attempt.
        expect(vi.mocked(prepareInterstitial).mock.calls.length).toBe(preloadCallsAfterInit + 1);
        cleanup();
    });
});

describe("watchRewardedToHideBanner()", () => {
    beforeEach(() => {
        localStorage.clear();
        resetPluginMocks();
        vi.useFakeTimers();
    });
    afterEach(() => vi.useRealTimers());

    test("returns false when not available", async () => {
        const { ads, cleanup } = createInRoot();
        const granted = await ads.watchRewardedToHideBanner();
        expect(granted).toBe(false);
        expect(showRewarded).not.toHaveBeenCalled();
        cleanup();
    });

    test("returns false when preload hasn't settled and re-kicks the load", async () => {
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockRejectedValue(new Error("no fill"));
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        const before = vi.mocked(prepareRewarded).mock.calls.length;

        const granted = await ads.watchRewardedToHideBanner();
        expect(granted).toBe(false);
        expect(showRewarded).not.toHaveBeenCalled();
        expect(vi.mocked(prepareRewarded).mock.calls.length).toBe(before + 1);
        cleanup();
    });

    test("grants 24h window and hides live banner on full completion", async () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
        const now = Date.now();
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);
        vi.mocked(showBannerCmd).mockResolvedValue({ shown: true } as never);
        vi.mocked(hideBannerCmd).mockResolvedValue(undefined as never);
        vi.mocked(showRewarded).mockResolvedValue({
            shown: true,
            reward: { type: "coins", amount: 1 },
        } as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        await ads.showBanner();
        expect(ads.bannerShown).toBe(true);

        const granted = await ads.watchRewardedToHideBanner();
        expect(granted).toBe(true);
        expect(ads.noBannerUntil).toBe(now + NO_BANNER_DURATION_MS);
        expect(hideBannerCmd).toHaveBeenCalledTimes(1);
        expect(ads.bannerShown).toBe(false);
        cleanup();
    });

    test("does NOT grant when user backs out (shown=true, reward=undefined)", async () => {
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);
        vi.mocked(showRewarded).mockResolvedValue({ shown: true } as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        const granted = await ads.watchRewardedToHideBanner();
        expect(granted).toBe(false);
        expect(ads.noBannerUntil).toBe(0);
        expect(hideBannerCmd).not.toHaveBeenCalled();
        cleanup();
    });

    test("re-preloads after a show so the next call has inventory", async () => {
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);
        vi.mocked(showRewarded).mockResolvedValue({ shown: true } as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        const before = vi.mocked(prepareRewarded).mock.calls.length;

        await ads.watchRewardedToHideBanner();
        await flushMicrotasks();
        expect(vi.mocked(prepareRewarded).mock.calls.length).toBe(before + 1);
        cleanup();
    });
});

describe("maybeShowAppOpen()", () => {
    beforeEach(() => {
        localStorage.clear();
        resetPluginMocks();
    });

    test("skips silently when not available", async () => {
        const { ads, cleanup } = createInRoot();
        await ads.maybeShowAppOpen();
        expect(showAppOpen).not.toHaveBeenCalled();
        cleanup();
    });

    test("first launch ever: flips the persisted flag and skips the show", async () => {
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        await ads.maybeShowAppOpen();
        expect(showAppOpen).not.toHaveBeenCalled();
        flushSync();
        expect(localStorage.getItem("minesweeper-cube:ads:hasLaunchedBefore")).toBe("true");
        cleanup();
    });

    test("subsequent launch with preloaded ad: shows it and re-preloads", async () => {
        localStorage.setItem("minesweeper-cube:ads:hasLaunchedBefore", "true");
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);
        vi.mocked(showAppOpen).mockResolvedValue({ shown: true } as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        const preloadsBefore = vi.mocked(prepareAppOpen).mock.calls.length;

        await ads.maybeShowAppOpen();
        await flushMicrotasks();
        expect(showAppOpen).toHaveBeenCalledTimes(1);
        expect(vi.mocked(prepareAppOpen).mock.calls.length).toBe(preloadsBefore + 1);
        cleanup();
    });

    test("subsequent launch where preload never settles: bails out after APP_OPEN_WAIT_MS", async () => {
        localStorage.setItem("minesweeper-cube:ads:hasLaunchedBefore", "true");
        vi.mocked(initialize).mockResolvedValue(undefined as never);
        vi.mocked(prepareInterstitial).mockResolvedValue(undefined as never);
        vi.mocked(prepareRewarded).mockResolvedValue(undefined as never);
        // App-open preload hangs forever (simulates a stuck cold-start network call).
        vi.mocked(prepareAppOpen).mockReturnValue(new Promise(() => {}) as never);

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        vi.useFakeTimers();
        const promise = ads.maybeShowAppOpen();
        // Drive past the deadline. The polling loop sleeps 100ms at a time, so we advance
        // through several intervals to give the while-loop a chance to exit.
        await vi.advanceTimersByTimeAsync(APP_OPEN_WAIT_MS + 200);
        await promise;
        vi.useRealTimers();

        expect(showAppOpen).not.toHaveBeenCalled();
        cleanup();
    });
});
