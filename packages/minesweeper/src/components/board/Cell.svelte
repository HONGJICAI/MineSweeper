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
        onMouseEnter,
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
        onMouseEnter: (e: MouseEvent, r: number, c: number) => void;
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

    // Classic Minesweeper number palette. Dark-mode variants are lightened so
    // they stay readable on the revealed cell's dark background.
    const NUMBER_COLORS: Record<number, string> = {
        1: "text-blue-600 dark:text-blue-400",
        2: "text-green-700 dark:text-green-400",
        3: "text-red-600 dark:text-red-400",
        4: "text-indigo-800 dark:text-indigo-300",
        5: "text-rose-800 dark:text-rose-400",
        6: "text-teal-600 dark:text-teal-300",
        7: "text-gray-900 dark:text-gray-200",
        8: "text-gray-500 dark:text-gray-400",
    };
    const numberColor = $derived(
        cell.isRevealed && !cell.isMine && cell.adjacentMines > 0
            ? NUMBER_COLORS[cell.adjacentMines] ?? ""
            : ""
    );
</script>

<button
    type="button"
    id="cell-{r}-{c}"
    onmousedown={(e) => onMouseDown(e, r, c)}
    onmouseup={(e) => onMouseUp(e, r, c)}
    onmouseenter={(e) => onMouseEnter(e, r, c)}
    ontouchstart={(e) => onTouchStart(e, r, c)}
    ontouchend={(e) => onTouchEnd(e, r, c)}
    class="size-8 flex items-center justify-center border border-gray-400 dark:border-gray-600 text-lg font-mono font-bold select-none touch-manipulation {numberColor || 'text-gray-900 dark:text-gray-100'}"
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
