<script lang="ts">
    import Button from "../ui/Button.svelte";

    let {
        title,
        message,
        confirmLabel = "Confirm",
        cancelLabel = "Cancel",
        onConfirm,
        onCancel,
    }: {
        title: string;
        message: string;
        confirmLabel?: string;
        cancelLabel?: string;
        onConfirm: () => void;
        onCancel: () => void;
    } = $props();
</script>

<div class="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm shadow-xl">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
        <div class="flex gap-2 justify-end">
            <Button onclick={onCancel}>{cancelLabel}</Button>
            <Button variant="danger" onclick={onConfirm}>{confirmLabel}</Button>
        </div>
    </div>
</div>
