<script lang="ts">
    import { Button } from "@caiji-games/shared-ui";
    import type { GameMode } from "@caiji-games/sliding-puzzle-core";
    import GameSettings from "./GameSettings.svelte";

    let {
        mode,
        onModeChange,
        gameSize,
        onGameSizeChange,
        selectedImage,
        onImageChange,
        onImageUpload,
        showNumbers,
        onShowNumbersChange,
    }: {
        mode: GameMode;
        onModeChange: (mode: GameMode) => void;
        gameSize: number;
        onGameSizeChange: (size: number) => void;
        selectedImage: string;
        onImageChange: (image: string) => void;
        onImageUpload: (event: Event) => void;
        showNumbers: boolean;
        onShowNumbersChange: (show: boolean) => void;
    } = $props();
</script>

<div class="flex items-center gap-4">
    <div class="flex gap-2">
        <Button
            onclick={() => onModeChange("number")}
            title="数字模式"
            ariaLabel="切换到数字模式"
        >
            🔢
        </Button>
        <Button
            onclick={() => onModeChange("image")}
            title="图片模式"
            ariaLabel="切换到图片模式"
        >
            🖼️
        </Button>
    </div>

    <GameSettings
        {mode}
        {gameSize}
        {onGameSizeChange}
        {selectedImage}
        {onImageChange}
        {onImageUpload}
        {showNumbers}
        {onShowNumbersChange}
    />
</div>
