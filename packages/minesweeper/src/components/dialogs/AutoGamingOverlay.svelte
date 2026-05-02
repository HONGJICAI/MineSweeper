<script lang="ts">
    import Button from "../ui/Button.svelte";
    import Modal from "../ui/Modal.svelte";

    let {
        isAutoPlaying,
        title,
        onCancel,
        onStart,
    }: {
        isAutoPlaying: boolean;
        title?: string;
        onCancel: () => void;
        onStart: (speed: number) => void;
    } = $props();

    let speedOption = $state<"custom" | "gamer">("gamer");
    let customSpeed = $state(500);

    function play() {
        const speed = speedOption === "custom" ? customSpeed : -1;
        onStart(speed);
    }

    const cornerBase = "absolute w-10 h-10 border-2 border-blue-500 dark:border-blue-400 pointer-events-none";
</script>

<div class="absolute inset-0 z-[1000] animate-fade-in">
    <!-- Three L-shaped corner brackets — the fourth (top-right) is the cancel button. -->
    <div class="{cornerBase} top-3 left-3 border-r-0 border-b-0"></div>
    <div class="{cornerBase} bottom-3 left-3 border-r-0 border-t-0"></div>
    <div class="{cornerBase} bottom-3 right-3 border-l-0 border-t-0"></div>

    <button
        type="button"
        onclick={onCancel}
        aria-label="Cancel replay"
        title="Cancel replay"
        class="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-md border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-500/15 dark:hover:bg-blue-400/15 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    </button>

    <div class="absolute top-4 left-[60px] flex items-center gap-2 pointer-events-none">
        <div class="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-blink"></div>
        <span class="text-blue-600 dark:text-blue-400 text-sm font-medium tracking-wider">
            {title || "REPLAY"}
        </span>
    </div>

    <Modal show={!isAutoPlaying} onClose={onCancel} title="Replay Speed">
        <div class="flex flex-col gap-3">
            <div class="flex gap-2">
                <Button active={speedOption === "gamer"} onclick={() => (speedOption = "gamer")} class="flex-1">
                    🎮 Your speed
                </Button>
                <Button active={speedOption === "custom"} onclick={() => (speedOption = "custom")} class="flex-1">
                    ⚙️ Custom
                </Button>
            </div>

            {#if speedOption === "custom"}
                <div class="flex items-center gap-2 px-1">
                    <input
                        type="number"
                        min="100"
                        max="1000"
                        step="100"
                        bind:value={customSpeed}
                        class="w-24 px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span class="text-sm text-gray-600 dark:text-gray-400">ms per step</span>
                </div>
            {/if}

            <Button variant="primary" size="lg" onclick={play} class="w-full">▶ Go</Button>
        </div>
    </Modal>
</div>
