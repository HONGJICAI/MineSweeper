<script lang="ts">
    import {
        createBoard,
        createSolvedBoard,
        moveTile,
        type GameMode,
        type GameState,
        type GameStats,
    } from "@caiji-games/sliding-puzzle-core";
    import { getDefaultImageUrl } from "../utils/defaultImages";
    import GameBoard from "./GameBoard.svelte";
    import GameStatsDisplay from "./GameStatsDisplay.svelte";
    import GameControl from "./GameControl.svelte";

    let {
        mode,
        onModeChange,
    }: {
        mode: GameMode;
        onModeChange: (m: GameMode) => void;
    } = $props();

    function solvedState(size: number): GameState {
        const board = createSolvedBoard(size);
        return {
            board,
            size,
            emptyIndex: board.indexOf(null),
            moves: 0,
            startTime: null,
            endTime: null,
            isCompleted: true,
        };
    }

    let gameState = $state<GameState>(solvedState(3));
    let currentTime = $state(0);
    let selectedImage = $state<string>(getDefaultImageUrl("simple"));
    let showNumbers = $state(false);

    let intervalId: ReturnType<typeof setInterval> | null = null;
    $effect(() => {
        if (gameState.startTime && !gameState.isCompleted) {
            intervalId = setInterval(() => {
                currentTime += 1000;
            }, 1000);
            return () => {
                if (intervalId) clearInterval(intervalId);
                intervalId = null;
            };
        }
    });

    function handleTileClick(index: number) {
        if (gameState.isCompleted) return;
        gameState = moveTile(gameState, index);
    }

    function startNewGame() {
        const board = createBoard(gameState.size);
        gameState = {
            board,
            size: gameState.size,
            emptyIndex: board.indexOf(null),
            moves: 0,
            startTime: Date.now(),
            endTime: null,
            isCompleted: false,
        };
        currentTime = 0;
    }

    function resetGame() {
        if (gameState.isCompleted) return;
        gameState = solvedState(gameState.size);
        currentTime = 0;
    }

    function changeSize(size: number) {
        gameState = solvedState(size);
        currentTime = 0;
    }

    function changeMode(newMode: GameMode) {
        onModeChange(newMode);
        gameState = solvedState(gameState.size);
        currentTime = 0;
    }

    function uploadImage(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) selectedImage = e.target.result as string;
        };
        reader.readAsDataURL(file);
    }

    let stats = $derived<GameStats>({
        moves: gameState.moves,
        time: gameState.isCompleted
            ? gameState.endTime && gameState.startTime
                ? gameState.endTime - gameState.startTime
                : 0
            : gameState.startTime
              ? currentTime
              : 0,
        isCompleted: gameState.isCompleted,
    });
</script>

<div class="p-4 max-w-[1200px] mx-auto min-h-dvh">
    <div class="flex justify-center items-center flex-wrap gap-4">
        <h1 class="flex justify-center text-center m-1.5 text-2xl font-bold text-gray-900 dark:text-gray-100">
            滑动拼图
        </h1>
    </div>

    <div class="flex justify-center">
        <div class="flex gap-2 items-center flex-col">
            <GameControl
                {mode}
                onModeChange={changeMode}
                gameSize={gameState.size}
                onGameSizeChange={changeSize}
                {selectedImage}
                onImageChange={(img) => (selectedImage = img)}
                onImageUpload={uploadImage}
                {showNumbers}
                onShowNumbersChange={(v) => (showNumbers = v)}
            />
            <GameStatsDisplay {stats} onNewGame={startNewGame} onResetGame={resetGame} />
            <GameBoard
                {gameState}
                {mode}
                {selectedImage}
                {showNumbers}
                onTileClick={handleTileClick}
            />
        </div>
    </div>
</div>
