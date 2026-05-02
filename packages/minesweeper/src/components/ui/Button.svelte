<script lang="ts" module>
    export type ButtonVariant = "primary" | "secondary" | "ghost" | "icon" | "danger";
    export type ButtonSize = "sm" | "md" | "lg";

    const sizeClasses: Record<ButtonSize, string> = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1",
        lg: "px-6 py-2 text-base",
    };

    const iconSizeClasses: Record<ButtonSize, string> = {
        sm: "p-1",
        md: "p-2",
        lg: "p-3",
    };

    const variantClasses: Record<ButtonVariant, string> = {
        primary:
            "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700",
        secondary:
            "bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:active:bg-gray-500",
        ghost:
            "bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800",
        icon:
            "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
        danger:
            "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 dark:bg-red-500 dark:hover:bg-red-600 dark:active:bg-red-700 focus:ring-red-500",
    };
</script>

<script lang="ts">
    import type { Snippet } from "svelte";

    let {
        children,
        onclick,
        variant = "secondary",
        size = "md",
        active = false,
        disabled = false,
        type = "button",
        class: className = "",
        title,
        ariaLabel,
    }: {
        children: Snippet;
        onclick?: (e: MouseEvent) => void;
        variant?: ButtonVariant;
        size?: ButtonSize;
        /** Toggle/pressed state — visually overrides the variant with the primary look. */
        active?: boolean;
        disabled?: boolean;
        type?: "button" | "submit" | "reset";
        class?: string;
        title?: string;
        ariaLabel?: string;
    } = $props();

    const baseClass =
        "rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500";

    let sizing = $derived(variant === "icon" ? iconSizeClasses[size] : sizeClasses[size]);
    let styling = $derived(active ? variantClasses.primary : variantClasses[variant]);
    let disabledClass = $derived(disabled ? "opacity-50 cursor-not-allowed" : "");
</script>

<button
    {type}
    {onclick}
    {disabled}
    {title}
    aria-label={ariaLabel}
    aria-pressed={active}
    class="{baseClass} {sizing} {styling} {disabledClass} {className}"
>
    {@render children()}
</button>
