import { describe, test, expect, beforeEach, vi } from "vitest";
import { flushSync } from "svelte";

// Every plugin entry point is mocked; each test rewrites the implementations to drive the
// success / refusal / failure paths. Note this suite imports ads.svelte.ts directly rather than
// through the `$ads` alias — the alias resolves to the no-op stub on non-mobile builds, and the
// stub has nothing worth testing.
vi.mock("@caiji-games/tauri-plugin-admob-api", () => ({
    initialize: vi.fn(),
    requestConsent: vi.fn(),
    showPrivacyOptionsForm: vi.fn(),
    showBanner: vi.fn(),
    hideBanner: vi.fn(),
    prepareAppOpen: vi.fn(),
    showAppOpen: vi.fn(),
}));

import {
    initialize,
    requestConsent,
    showPrivacyOptionsForm,
    showBanner as showBannerCmd,
    hideBanner as hideBannerCmd,
    prepareAppOpen,
    showAppOpen,
} from "@caiji-games/tauri-plugin-admob-api";
import { createAdsState, type AdsState } from "./ads.svelte.ts";

// What a player outside the EEA/UK/CH gets: nothing to ask, ads allowed. The overwhelmingly
// common case, so it is the default for every test that isn't specifically about consent.
const CONSENT_OK = {
    status: "notRequired" as const,
    canRequestAds: true,
    privacyOptionsRequired: false,
};

function resetPluginMocks() {
    vi.mocked(initialize).mockReset();
    vi.mocked(initialize).mockResolvedValue(undefined as never);
    vi.mocked(requestConsent).mockReset();
    vi.mocked(requestConsent).mockResolvedValue(CONSENT_OK);
    vi.mocked(showPrivacyOptionsForm).mockReset();
    vi.mocked(showBannerCmd).mockReset();
    vi.mocked(showBannerCmd).mockResolvedValue(undefined as never);
    vi.mocked(hideBannerCmd).mockReset();
    vi.mocked(hideBannerCmd).mockResolvedValue(undefined as never);
    vi.mocked(prepareAppOpen).mockReset();
    vi.mocked(prepareAppOpen).mockResolvedValue(undefined as never);
    vi.mocked(showAppOpen).mockReset();
    vi.mocked(showAppOpen).mockResolvedValue(undefined as never);
}

function createInRoot(): { ads: AdsState; cleanup: () => void } {
    let ads!: AdsState;
    const cleanup = $effect.root(() => {
        ads = createAdsState();
    });
    return { ads, cleanup };
}

// init() kicks off the App Open preload with `void`, so it resolves on the microtask queue.
async function flushMicrotasks() {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
}

describe("createAdsState — initial state", () => {
    beforeEach(resetPluginMocks);

    test("starts inert: nothing available, no banner, nothing to consent to", () => {
        const { ads, cleanup } = createInRoot();
        expect(ads.available).toBe(false);
        expect(ads.bannerShown).toBe(false);
        expect(ads.privacyOptionsRequired).toBe(false);
        cleanup();
    });
});

describe("init()", () => {
    beforeEach(resetPluginMocks);

    test("consent runs before SDK init — the ordering is a hard requirement", async () => {
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

    test("on success: flips available and preloads the App Open ad", async () => {
        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        expect(ads.available).toBe(true);
        expect(prepareAppOpen).toHaveBeenCalledTimes(1);
        cleanup();
    });

    test("on init failure (non-Android): stays unavailable, no preload", async () => {
        vi.mocked(initialize).mockRejectedValue(new Error("not implemented"));

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        expect(ads.available).toBe(false);
        expect(prepareAppOpen).not.toHaveBeenCalled();
        cleanup();
    });
});

describe("consent (UMP / GDPR)", () => {
    beforeEach(resetPluginMocks);

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
        expect(prepareAppOpen).not.toHaveBeenCalled();
        // Still surfaced so the lobby can render the entry point even with ads switched off.
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

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        expect(ads.available).toBe(true);
        expect(ads.privacyOptionsRequired).toBe(true);
        cleanup();
    });

    test("consent throwing doesn't block init (plugin missing / non-Android)", async () => {
        vi.mocked(requestConsent).mockRejectedValue(new Error("not implemented"));

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        expect(initialize).toHaveBeenCalledTimes(1);
        expect(ads.available).toBe(true);
        cleanup();
    });

    test("openPrivacyOptions is a no-op where the region doesn't require it", async () => {
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
        expect(ads.privacyOptionsRequired).toBe(false);
        // Withdrawal only takes effect on the next cold start — this session keeps its live SDK.
        expect(ads.available).toBe(true);
        cleanup();
    });
});

describe("banner — follows the lobby/game view", () => {
    beforeEach(resetPluginMocks);

    test("skips while unavailable, so a pre-init call cannot leak an ad request", async () => {
        const { ads, cleanup } = createInRoot();
        await ads.showBanner();
        expect(showBannerCmd).not.toHaveBeenCalled();
        expect(ads.bannerShown).toBe(false);
        cleanup();
    });

    test("shows once and flips bannerShown; a second call is a no-op", async () => {
        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        await ads.showBanner();
        flushSync();
        expect(showBannerCmd).toHaveBeenCalledTimes(1);
        expect(ads.bannerShown).toBe(true);

        // Entering and leaving the lobby repeatedly must not stack banner requests.
        await ads.showBanner();
        expect(showBannerCmd).toHaveBeenCalledTimes(1);
        cleanup();
    });

    test("hide clears the flag so returning to the lobby shows it again", async () => {
        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        await ads.showBanner();
        await ads.hideBanner();
        flushSync();
        expect(hideBannerCmd).toHaveBeenCalledTimes(1);
        expect(ads.bannerShown).toBe(false);

        await ads.showBanner();
        flushSync();
        expect(showBannerCmd).toHaveBeenCalledTimes(2);
        expect(ads.bannerShown).toBe(true);
        cleanup();
    });

    test("hide while nothing is showing does not call the plugin", async () => {
        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        await ads.hideBanner();
        expect(hideBannerCmd).not.toHaveBeenCalled();
        cleanup();
    });

    test("a failed hide still clears the flag, or showBanner would be blocked forever", async () => {
        vi.mocked(hideBannerCmd).mockRejectedValue(new Error("no banner"));

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        await ads.showBanner();
        await ads.hideBanner();
        flushSync();
        expect(ads.bannerShown).toBe(false);

        await ads.showBanner();
        expect(showBannerCmd).toHaveBeenCalledTimes(2);
        cleanup();
    });

    test("a failed show leaves bannerShown false so it can be retried", async () => {
        vi.mocked(showBannerCmd).mockRejectedValue(new Error("no fill"));

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();

        await ads.showBanner();
        flushSync();
        expect(ads.bannerShown).toBe(false);
        cleanup();
    });
});

describe("maybeShowAppOpen()", () => {
    beforeEach(resetPluginMocks);

    test("skips silently when unavailable", async () => {
        const { ads, cleanup } = createInRoot();
        await ads.maybeShowAppOpen();
        expect(showAppOpen).not.toHaveBeenCalled();
        cleanup();
    });

    test("shows the preloaded ad and immediately warms the next one", async () => {
        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        expect(prepareAppOpen).toHaveBeenCalledTimes(1);

        await ads.maybeShowAppOpen();
        await flushMicrotasks();

        expect(showAppOpen).toHaveBeenCalledTimes(1);
        expect(prepareAppOpen).toHaveBeenCalledTimes(2);
        cleanup();
    });

    test("preload failure means no ad is shown, and init still completes", async () => {
        vi.mocked(prepareAppOpen).mockRejectedValue(new Error("no fill"));

        const { ads, cleanup } = createInRoot();
        await ads.init();
        await flushMicrotasks();
        flushSync();

        // available is about the SDK, not about inventory — a missing ad must not disable ads.
        expect(ads.available).toBe(true);
        cleanup();
    });
});
