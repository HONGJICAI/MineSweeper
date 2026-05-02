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
</script>

<div
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
                onTouchStart={touch.onTouchStart}
                onTouchEnd={touch.onTouchEnd}
            />
        {/each}
    {/each}
</div>
