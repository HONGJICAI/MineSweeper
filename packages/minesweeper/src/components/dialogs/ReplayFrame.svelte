<script lang="ts">
    import { Button } from "@caiji-games/shared-ui";

    let {
        isAutoPlaying,
        paused,
        progress,
        onCancel,
        onStart,
        onTogglePause,
    }: {
        isAutoPlaying: boolean;
        paused: boolean;
        progress: { current: number; total: number } | null;
        onCancel: () => void;
        onStart: (speed: number) => void;
        onTogglePause: () => void;
    } = $props();

    // Speed picker is hidden for now: every replay runs at the pace the game was actually played
    // at. The picker and the custom-ms input are kept rather than deleted because the underlying
    // support is in the state layer (`start(-1)` means real time, any positive number is a fixed
    // per-step delay, both covered by tests) -- flipping this back on is a one-line change.
    const SHOW_SPEED_OPTIONS = false;

    let speedOption = $state<"custom" | "gamer">("gamer");
    let customSpeed = $state(500);

    function play() {
        onStart(SHOW_SPEED_OPTIONS && speedOption === "custom" ? customSpeed : -1);
    }

    // Brackets sit flush with the board edge rather than outset: the board lives in an
    // overflow-auto container, so a negative offset would be clipped. Overlapping the outermost
    // cells by a couple of pixels is the trade.
    //
    // Known and accepted: on Medium (~542px) and Hard (~1018px) the board is wider than a phone
    // screen (~411px), so the right-hand brackets start off-screen and only appear once the board
    // is scrolled sideways. They are pinned to the board's corners and scroll with it, which is
    // self-consistent. Framing the *viewport* instead would need the board's live position
    // (ResizeObserver + scroll listener, recomputed per frame) and the brackets are atmosphere —
    // the scrim, the control strip and the blinking REPLAY dot already carry the message.
    const corner = "absolute w-7 h-7 border-blue-400 dark:border-blue-300";
</script>

<!--
    Anchored to the board (App.svelte wraps it in `relative`), not the viewport. The old version
    put brackets in the screen corners, where they collided with the back and sidebar buttons and
    never showed *what* was being replayed.

    The dimming itself is not here: App.svelte lays a full-screen scrim behind the board and lifts
    the board above it. The obvious alternative — a transparent cut-out with a huge box-shadow —
    does not survive the board's `overflow-auto` scroll container, which clips the shadow, so only
    the area below the board ended up dimmed.
-->
<div class="absolute inset-0 z-40 pointer-events-none">
    <div class="{corner} top-0 left-0 border-t-2 border-l-2"></div>
    <div class="{corner} top-0 right-0 border-t-2 border-r-2"></div>
    <div class="{corner} bottom-0 left-0 border-b-2 border-l-2"></div>
    <div class="{corner} bottom-0 right-0 border-b-2 border-r-2"></div>

    <!-- Control strip is `fixed`, not positioned against the board: on Medium/Hard the board is
         taller than the viewport and lives in a scroll container, so anchoring below it would put
         the controls off-screen or get them clipped. Pinning to the bottom of the screen also
         keeps them in the same place regardless of difficulty. The banner ad is hidden during a
         game (it only shows in the lobby), so nothing collides down there. -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] w-max max-w-[92vw] pointer-events-auto">
        {#if isAutoPlaying}
            <div class="flex items-center gap-3 rounded-lg bg-slate-900/85 px-3 py-2 shadow-lg ring-1 ring-blue-400/40">
                <span class="flex items-center gap-2 text-blue-300 text-xs font-medium tracking-wider">
                    <span
                        class="w-2 h-2 rounded-full bg-blue-400 {paused ? 'opacity-40' : 'animate-blink'}"
                    ></span>
                    {paused ? "PAUSED" : "REPLAY"}
                </span>

                {#if progress}
                    <span class="text-slate-300 text-xs font-mono tabular-nums">
                        {progress.current}/{progress.total}
                    </span>
                {/if}

                <Button class="px-2 py-2" onclick={onTogglePause} ariaLabel={paused ? "Resume replay" : "Pause replay"}>
                    {#if paused}
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    {:else}
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
                    {/if}
                </Button>

                <Button class="px-2 py-2" onclick={onCancel} ariaLabel="Stop replay">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </Button>
            </div>
        {:else}
            <!-- Speed picker. Deliberately not a Modal: the frame already dims everything outside
                 the board, so a second backdrop would double-dim and the dialog would cover the
                 very board the player is about to watch. -->
            <div class="flex flex-col gap-2 rounded-lg bg-slate-900/90 p-3 shadow-lg ring-1 ring-blue-400/40">
                <div class="flex items-center justify-between gap-3">
                    <span class="text-blue-300 text-xs font-medium tracking-wider">
                        {SHOW_SPEED_OPTIONS ? "REPLAY SPEED" : "REPLAY"}
                    </span>
                    <button
                        type="button"
                        onclick={onCancel}
                        aria-label="Cancel replay"
                        class="text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {#if SHOW_SPEED_OPTIONS}
                    <div class="flex gap-2">
                        <Button active={speedOption === "gamer"} onclick={() => (speedOption = "gamer")} class="flex-1 px-2 py-2 text-sm">
                            🎮 Your speed
                        </Button>
                        <Button active={speedOption === "custom"} onclick={() => (speedOption = "custom")} class="flex-1 px-2 py-2 text-sm">
                            ⚙️ Custom
                        </Button>
                    </div>

                    {#if speedOption === "custom"}
                        <div class="flex items-center gap-2">
                            <input
                                type="number"
                                min="100"
                                max="1000"
                                step="100"
                                bind:value={customSpeed}
                                class="w-20 px-2 py-1 rounded-md border border-slate-600 bg-slate-800 text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span class="text-xs text-slate-400">ms per step</span>
                        </div>
                    {/if}
                {/if}

                <Button variant="primary" onclick={play} class="w-full px-2 py-2">▶ Go</Button>
            </div>
        {/if}
    </div>
</div>
