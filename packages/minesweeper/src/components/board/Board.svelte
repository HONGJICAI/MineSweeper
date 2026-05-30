<script lang="ts">
    import { GameStatus, type Position } from "@caiji-games/minesweeper-core";
    import Cell from "./Cell.svelte";
    import type { GameState } from "../../state/game.svelte";
    import type { DesktopMouseState } from "../../state/desktopMouse.svelte";
    import type { MobileTouchState } from "../../state/mobileTouch.svelte";

    let {
        game,
        mouse,
        touch,
        highlightedCell,
    }: {
        game: GameState;
        mouse: DesktopMouseState;
        touch: MobileTouchState;
        highlightedCell?: Position;
    } = $props();

    function canPress(r: number, c: number): boolean {
        const cell = game.board[r][c];
        return (
            !cell.isRevealed &&
            !cell.isFlagged &&
            game.gameStatus !== GameStatus.GameOver &&
            game.gameStatus !== GameStatus.Win
        );
    }

    let gridEl: HTMLDivElement | undefined = $state();

    // Auto-frame the highlighted cell. When the cell sits inside the comfortable
    // middle of the scroll container (inner 50%) we don't scroll. When it crosses
    // into the outer 25% margin near any edge, we recenter it so the surrounding
    // cells are visible — useful for replay playback and sidebar-hover preview.
    const SAFE_ZONE = 0.25; // outer ratio per side that triggers a recenter
    $effect(() => {
        if (!highlightedCell || !gridEl) return;
        const container = gridEl.parentElement;
        if (!container) return;
        const cell = document.getElementById(`cell-${highlightedCell.r}-${highlightedCell.c}`);
        if (!cell) return;

        const cRect = container.getBoundingClientRect();
        const eRect = cell.getBoundingClientRect();
        const cx = (eRect.left + eRect.right) / 2;
        const cy = (eRect.top + eRect.bottom) / 2;
        const outOfSafeX = cx < cRect.left + cRect.width * SAFE_ZONE || cx > cRect.right - cRect.width * SAFE_ZONE;
        const outOfSafeY = cy < cRect.top + cRect.height * SAFE_ZONE || cy > cRect.bottom - cRect.height * SAFE_ZONE;

        if (outOfSafeX || outOfSafeY) {
            cell.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
    });
</script>

<div
    bind:this={gridEl}
    class="grid"
    style:grid-template-rows="repeat({game.board.length}, 2rem)"
    style:grid-template-columns="repeat({game.board[0].length}, 2rem)"
    style:gap="2px"
    onmouseleave={mouse.onLeave}
    ontouchmove={touch.onTouchMove}
    ontouchcancel={touch.onTouchCancel}
    role="grid"
    tabindex="-1"
>
    {#each game.board as row, r (r)}
        {#each row as cell, c (c)}
            <Cell
                {cell}
                {r}
                {c}
                gameStatus={game.gameStatus}
                isPressed={mouse.isPressed(r, c, canPress(r, c))}
                isHighlighted={highlightedCell?.r === r && highlightedCell?.c === c}
                lastStepOnMine={game.revealedMinePos?.r === r && game.revealedMinePos?.c === c}
                onMouseDown={mouse.onMouseDown}
                onMouseUp={mouse.onMouseUp}
                onMouseEnter={mouse.onMouseEnter}
                onTouchStart={touch.onTouchStart}
                onTouchEnd={touch.onTouchEnd}
            />
        {/each}
    {/each}
</div>
