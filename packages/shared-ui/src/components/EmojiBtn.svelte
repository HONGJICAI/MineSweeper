<script lang="ts">
    let {
        emoji,
        onclick,
        class: className = "",
        disabled = false,
        title,
        ariaLabel,
    }: {
        emoji: string;
        onclick?: (e: MouseEvent) => void;
        class?: string;
        disabled?: boolean;
        title?: string;
        ariaLabel?: string;
    } = $props();
</script>

<button
    type="button"
    {onclick}
    {disabled}
    {title}
    aria-label={ariaLabel}
    class="px-3 py-1 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:active:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed {className}"
>
    {emoji}
</button>
