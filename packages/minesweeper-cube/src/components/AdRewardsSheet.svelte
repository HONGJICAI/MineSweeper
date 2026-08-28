<script lang="ts">
    import type { AdsState } from "$ads";

    type Props = {
        ads: AdsState;
        onClose: () => void;
    };
    const { ads, onClose }: Props = $props();

    // `now` ticks while the sheet is mounted so the "X time left" line stays accurate. The
    // interval is cleaned up by the effect teardown when the sheet closes, so no background
    // timer lingers behind the modal.
    let now = $state(Date.now());
    $effect(() => {
        const id = setInterval(() => (now = Date.now()), 60_000);
        return () => clearInterval(id);
    });
    const noBannerRemainingMs = $derived(Math.max(0, ads.noBannerUntil - now));

    function formatRemaining(ms: number): string {
        // Round up so "30 seconds left" doesn't render as "0m" — the reward disappears cleanly
        // only when the wall clock catches up to the deadline.
        const totalMinutes = Math.ceil(ms / 60_000);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }

    let watching = $state(false);
    async function watchRewarded() {
        if (watching) return;
        watching = true;
        try {
            const granted = await ads.watchRewardedToHideBanner();
            // Auto-close on success — the banner vanishing is the visual confirmation.
            if (granted) onClose();
        } finally {
            watching = false;
        }
    }

    // Consent re-entry. Only rendered where UMP says it's required (EEA/UK/CH) — everywhere else
    // there is no form to open, so an always-visible button would just dead-end.
    let openingPrivacy = $state(false);
    async function openPrivacyOptions() {
        if (openingPrivacy) return;
        openingPrivacy = true;
        try {
            await ads.openPrivacyOptions();
        } finally {
            openingPrivacy = false;
        }
    }

    function handleBackdrop(e: MouseEvent) {
        if (e.target === e.currentTarget) onClose();
    }
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") onClose();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
    class="absolute inset-0 z-40 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    onclick={handleBackdrop}
    role="presentation"
>
    <!--
        Extra bottom padding while the banner is live: the banner is a native AdView attached to
        the activity's content view, so it always paints on top of the WebView — no z-index can
        beat it. Without this the sheet's last line of text sits underneath it. Only needed on the
        phone layout, where the sheet is bottom-aligned; from `sm` up it's centred and clears the
        banner on its own.
    -->
    <div class="flex w-full max-w-md flex-col gap-4 rounded-t-2xl bg-slate-900 p-5 shadow-2xl ring-1 ring-slate-700 sm:rounded-2xl {ads.bannerShown ? 'pb-20 sm:pb-5' : ''}">
        <header class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-100">Ad-free reward</h2>
            <button
                type="button"
                class="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                onclick={onClose}
                aria-label="Close"
            >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </header>

        <section class="flex flex-col gap-2">
            {#if noBannerRemainingMs > 0}
                <div class="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2.5 text-sm text-slate-200">
                    <span class="flex items-center gap-2">
                        <span aria-hidden="true">🎁</span>
                        <span>Banner hidden</span>
                    </span>
                    <span class="tabular-nums text-slate-400">{formatRemaining(noBannerRemainingMs)} left</span>
                </div>
                <p class="text-xs text-slate-500">Come back after it expires to watch another video.</p>
            {:else}
                <button
                    type="button"
                    class="flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm transition-colors {ads.rewardedReady && !watching ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'cursor-not-allowed bg-slate-800/60 text-slate-500'}"
                    disabled={!ads.rewardedReady || watching}
                    onclick={watchRewarded}
                >
                    <span aria-hidden="true">🎬</span>
                    <span>{watching ? "Playing…" : ads.rewardedReady ? "Watch a video to hide banner for 24h" : "Loading ad…"}</span>
                </button>
                <p class="text-xs text-slate-500">Watch a short video and we'll hide the banner for the next 24 hours.</p>
            {/if}
        </section>

        {#if ads.privacyOptionsRequired}
            <section class="flex flex-col gap-2 border-t border-slate-800 pt-3">
                <button
                    type="button"
                    class="flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2.5 text-sm text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-500"
                    disabled={openingPrivacy}
                    onclick={openPrivacyOptions}
                >
                    <span aria-hidden="true">🔒</span>
                    <span>{openingPrivacy ? "Opening…" : "Ad privacy settings"}</span>
                </button>
                <p class="text-xs text-slate-500">Change what data is used to personalise your ads. Takes effect next time you open the app.</p>
            </section>
        {/if}
    </div>
</div>
