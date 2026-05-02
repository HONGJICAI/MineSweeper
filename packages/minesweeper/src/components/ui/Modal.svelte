<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        show,
        onClose,
        title,
        children,
    }: {
        show: boolean;
        onClose: () => void;
        title?: string;
        children: Snippet;
    } = $props();

    function stopPropagation(e: MouseEvent) {
        e.stopPropagation();
    }

    function handleKey(e: KeyboardEvent) {
        if (show && e.key === "Escape") onClose();
    }
</script>

<svelte:window onkeydown={handleKey} />

{#if show}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="fixed inset-0 bg-white/30 flex items-center justify-center z-50"
        onclick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        tabindex="-1"
    >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-h-full max-w-md relative"
            onclick={stopPropagation}
        >
            <button
                type="button"
                class="absolute top-2 right-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                onclick={onClose}
                aria-label="Close"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            {#if title}
                <h2 id="modal-title" class="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">{title}</h2>
            {/if}
            {@render children()}
        </div>
    </div>
{/if}
