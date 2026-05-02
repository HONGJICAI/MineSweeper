<script lang="ts">
    import { GameStatus, type CellType } from "@caiji-games/minesweeper-core";

    let {
        cell,
        r,
        c,
        gameStatus,
        isPressed = false,
        isHighlighted = false,
        lastStepOnMine = false,
        onMouseDown,
        onMouseUp,
        onTouchStart,
        onTouchEnd,
    }: {
        cell: CellType;
        r: number;
        c: number;
        gameStatus: GameStatus;
        isPressed?: boolean;
        isHighlighted?: boolean;
        lastStepOnMine?: boolean;
        onMouseDown: (e: MouseEvent, r: number, c: number) => void;
        onMouseUp: (e: MouseEvent, r: number, c: number) => void;
        onTouchStart: (e: TouchEvent, r: number, c: number) => void;
        onTouchEnd: (e: TouchEvent, r: number, c: number) => void;
    } = $props();

    function getText(): string {
        if (cell.isRevealed) {
            if (cell.isMine) return cell.isFlagged ? "🚩" : "💣";
            if (cell.adjacentMines > 0) return cell.adjacentMines.toString();
            return "";
        }
        if (cell.isFlagged) {
            if (gameStatus === GameStatus.GameOver && !cell.isMine) return "❌";
            return "🚩";
        }
        return "";
    }
</script>

<button
    type="button"
    id="cell-{r}-{c}"
    onmousedown={(e) => onMouseDown(e, r, c)}
    onmouseup={(e) => onMouseUp(e, r, c)}
    ontouchstart={(e) => onTouchStart(e, r, c)}
    ontouchend={(e) => onTouchEnd(e, r, c)}
    class="size-8 flex items-center justify-center border border-gray-400 dark:border-gray-600 text-lg font-mono select-none touch-manipulation text-gray-900 dark:text-gray-100"
    class:bg-gray-100={cell.isRevealed && !lastStepOnMine}
    class:dark:bg-gray-800={cell.isRevealed && !lastStepOnMine}
    class:bg-gray-200={!cell.isRevealed && isPressed}
    class:dark:bg-gray-700={!cell.isRevealed && isPressed}
    class:bg-gray-400={!cell.isRevealed && !isPressed}
    class:hover:bg-gray-300={!cell.isRevealed && !isPressed}
    class:dark:bg-gray-600={!cell.isRevealed && !isPressed}
    class:dark:hover:bg-gray-500={!cell.isRevealed && !isPressed}
    class:bg-red-400={lastStepOnMine}
    class:dark:bg-red-700={lastStepOnMine}
    class:ring-2={isHighlighted}
    class:ring-blue-500={isHighlighted}
    class:dark:ring-blue-300={isHighlighted}
>
    {getText()}
</button>
