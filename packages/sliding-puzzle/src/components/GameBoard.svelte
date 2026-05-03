<script lang="ts">
    import type { GameState, GameMode } from "@caiji-games/sliding-puzzle-core";

    let {
        gameState,
        mode,
        selectedImage,
        showNumbers = false,
        onTileClick,
    }: {
        gameState: GameState;
        mode: GameMode;
        selectedImage?: string;
        showNumbers?: boolean;
        onTileClick: (index: number) => void;
    } = $props();

    let imageMode = $derived(mode === "image" && !!selectedImage);

    // For image mode, the empty slot is also part of the picture once the
    // puzzle is solved (`completedEmpty`). Otherwise it stays a transparent gap.
    function tileNumber(tile: number | null, index: number): number | null {
        if (tile !== null) return tile;
        if (gameState.isCompleted && index === gameState.board.length - 1) {
            return gameState.size * gameState.size;
        }
        return null;
    }

    function tileLabel(tile: number | null, index: number): number | null {
        const n = tileNumber(tile, index);
        if (n === null) return null;
        if (mode === "number" || !selectedImage) return n;
        return showNumbers ? n : null;
    }

    function bgPosition(displayTile: number | null, size: number) {
        if (!displayTile || size <= 1) return { x: 0, y: 0 };
        const row = Math.floor((displayTile - 1) / size);
        const col = (displayTile - 1) % size;
        return {
            x: (col / (size - 1)) * 100,
            y: (row / (size - 1)) * 100,
        };
    }

    function handleKey(e: KeyboardEvent, index: number) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const tile = gameState.board[index];
            if (tile !== null) onTileClick(index);
        }
    }
</script>

<div class="game-board-container">
    <div class="game-board" data-grid-size={gameState.size}>
        {#each gameState.board as tile, index (index)}
            {@const displayTile = tileNumber(tile, index)}
            {@const isEmpty = tile === null}
            {@const isCompletedEmpty = isEmpty && gameState.isCompleted && index === gameState.board.length - 1}
            {@const pos = bgPosition(displayTile, gameState.size)}
            {@const showImage = imageMode && displayTile !== null}
            <button
                type="button"
                class="tile"
                class:empty={isEmpty}
                class:completed-empty={isCompletedEmpty}
                class:image-tile={imageMode}
                class:non-image-empty={isEmpty && imageMode && !isCompletedEmpty}
                disabled={isEmpty && !isCompletedEmpty}
                tabindex={tile !== null ? 0 : -1}
                aria-label={tile !== null ? `移动拼图块 ${tile}` : "空格"}
                onclick={() => tile !== null && onTileClick(index)}
                onkeydown={(e) => handleKey(e, index)}
                style:background-image={showImage ? `url(${selectedImage})` : undefined}
                style:background-size={showImage ? `${gameState.size * 100}% ${gameState.size * 100}%` : undefined}
                style:background-position={showImage ? `${pos.x}% ${pos.y}%` : undefined}
                style:background-repeat={showImage ? "no-repeat" : undefined}
            >
                {tileLabel(tile, index) ?? ""}
            </button>
        {/each}
    </div>
</div>

<style>
    .game-board-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 1rem;
    }

    .game-board {
        display: grid;
        gap: var(--gap);
        background-color: #333;
        border-radius: 10px;
        padding: var(--padding);
        width: var(--board-size);
        height: var(--board-size);
        box-sizing: border-box;
        --board-size: 480px;
        --padding: 8px;
        --gap: 3px;
    }

    .game-board[data-grid-size="3"] { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); --grid-count: 3; }
    .game-board[data-grid-size="4"] { grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); --grid-count: 4; }
    .game-board[data-grid-size="5"] { grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(5, 1fr); --grid-count: 5; }
    .game-board[data-grid-size="6"] { grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(6, 1fr); --grid-count: 6; }

    .tile {
        background-color: #f0f0f0;
        border: none;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        /* Only transition transform/background-color so background-position changes don't slide. */
        transition: transform 0.2s ease, background-color 0.2s ease;
        -webkit-user-select: none;
        user-select: none;
        font-weight: bold;
        color: #333;
        overflow: hidden;
        position: relative;
        width: 100%;
        height: 100%;
        padding: 0;
        font-size: calc(
            (var(--board-size) - var(--padding) * 2 - var(--gap) * (var(--grid-count) - 1)) / var(--grid-count) * 0.25
        );
    }

    .tile:hover:not(:disabled):not(.empty) {
        background-color: #e0e0e0;
        transform: scale(0.95);
    }

    .tile:active:not(:disabled):not(.empty) { transform: scale(0.9); }

    .tile.empty {
        background-color: transparent;
        cursor: default;
    }

    /* Empty slot in image mode (during play) reads as a black hole. */
    .tile.non-image-empty {
        background-color: #000000;
    }

    .tile.empty.completed-empty {
        background-color: #f0f0f0;
        cursor: default;
        animation: fadeInTile 1.5s ease-in-out forwards;
    }
    .tile.empty.completed-empty.image-tile {
        animation: fadeInImageTile 1.5s ease-in-out forwards;
    }

    @keyframes fadeInTile {
        0% { background-color: transparent; color: transparent; }
        50% { background-color: rgba(240, 240, 240, 0.5); color: rgba(51, 51, 51, 0.5); }
        100% { background-color: #f0f0f0; color: #333; }
    }

    @keyframes fadeInImageTile {
        0% { background-color: transparent; opacity: 0; }
        50% { background-color: rgba(240, 240, 240, 0.3); opacity: 0.5; }
        100% { background-color: #f0f0f0; opacity: 1; }
    }

    .tile:focus { outline: 3px solid #4a90e2; outline-offset: 2px; }

    @media (max-width: 768px) {
        .game-board { --board-size: 320px; --padding: 8px; --gap: 2px; }
        .tile { border-radius: 6px; }
    }

    @media (hover: none) {
        .tile:hover:not(:disabled):not(.empty) {
            background-color: #f0f0f0;
            transform: none;
        }
        .tile:active:not(:disabled):not(.empty) { transform: scale(0.95); }
    }

    :global(.dark) .game-board { background-color: #555; }
    :global(.dark) .tile { background-color: #444; color: #f6f6f6; }
    :global(.dark) .tile:hover:not(:disabled):not(.empty) { background-color: #555; }
    :global(.dark) .tile.empty.completed-empty { background-color: #444; animation: fadeInTileDark 1.5s ease-in-out forwards; }
    :global(.dark) .tile.empty.completed-empty.image-tile { animation: fadeInImageTileDark 1.5s ease-in-out forwards; }

    @keyframes fadeInTileDark {
        0% { background-color: transparent; color: transparent; }
        50% { background-color: rgba(68, 68, 68, 0.5); color: rgba(246, 246, 246, 0.5); }
        100% { background-color: #444; color: #f6f6f6; }
    }
    @keyframes fadeInImageTileDark {
        0% { background-color: transparent; opacity: 0; }
        50% { background-color: rgba(68, 68, 68, 0.3); opacity: 0.5; }
        100% { background-color: #444; opacity: 1; }
    }
</style>
