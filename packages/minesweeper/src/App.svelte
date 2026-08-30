<script lang="ts">
    import {
        GameStatus,
        type ActionType,
        type Difficulty,
        type PlayHistory,
        type Position,
        type UserActionDetail,
    } from "@caiji-games/minesweeper-core";
    import Board from "./components/board/Board.svelte";
    import GameControls from "./components/controls/GameControls.svelte";
    import GameSidebar from "./components/sidebar/GameSidebar.svelte";
    import StatisticsModal from "./components/dialogs/StatisticsModal.svelte";
    import ReplayFrame from "./components/dialogs/ReplayFrame.svelte";
    import LobbyScreen from "./components/LobbyScreen.svelte";
    import { Button, DarkModeToggle } from "@caiji-games/shared-ui";
    import { createGameState } from "./state/game.svelte";
    import { createDesktopMouseState } from "./state/desktopMouse.svelte";
    import { createMobileTouchState, type MobileMode } from "./state/mobileTouch.svelte";
    import { createUserActionsState } from "./state/userActions.svelte";
    import { createLeaderboardState } from "./state/leaderboard.svelte";
    import { createPlayHistoryState } from "./state/playHistory.svelte";
    import { createTimerState } from "@caiji-games/shared-state";
    import { createReplayState } from "./state/replay.svelte";
    import { createAdsState } from "$ads";

    const game = createGameState("easy");
    const userActions = createUserActionsState();
    const leaderboard = createLeaderboardState();
    const history = createPlayHistoryState();
    const timer = createTimerState();

    let highlightedCell = $state<Position | undefined>(undefined);
    let mobileMode = $state<MobileMode>("reveal");
    let showStats = $state(false);
    let skipHistory = false;

    // Touch-primary devices (phones, tablets) start in a lobby with big difficulty cards
    // and return to it after each game. Devices with a fine primary pointer (mouse) stay
    // in the inline game layout. Hybrid devices (Surface) follow whichever is currently
    // primary — switches mid-session if the user docks/undocks.
    const initialTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    let isPrimaryTouch = $state<boolean>(initialTouch);
    let view = $state<"lobby" | "game">(initialTouch ? "lobby" : "game");

    $effect(() => {
        if (typeof window === "undefined") return;
        const mq = window.matchMedia("(pointer: coarse)");
        const handler = (e: MediaQueryListEvent) => (isPrimaryTouch = e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    });

    // Desktop never sees lobby; if input switches to fine while in lobby, advance to game.
    $effect(() => {
        if (!isPrimaryTouch && view === "lobby") view = "game";
    });

    // Android only — on every other platform this is the no-op stub (see vite.config.ts) and the
    // AdMob plugin is not even compiled in (src-tauri/Cargo.toml scopes it to the android target).
    const ads = createAdsState();

    // Cold start: consent, then SDK init, then the App Open ad. maybeShowAppOpen() blocks until
    // the player dismisses the ad, which is fine — the lobby behind it is a menu, not gameplay.
    $effect(() => {
        ads.init().then(() => ads.maybeShowAppOpen());
    });

    // The banner belongs to the lobby and nowhere else: a banner pinned below a minesweeper grid
    // invites mis-taps, and a mis-tap on a live ad is invalid traffic that counts against the
    // AdMob account. Driving it from `view` means it also disappears the moment a game starts and
    // comes back when the player returns, without either call site having to remember.
    $effect(() => {
        if (isPrimaryTouch && view === "lobby") void ads.showBanner();
        else void ads.hideBanner();
    });

    // Wraps a game action so the result is recorded as a user action.
    function performAction(type: ActionType, r: number, c: number) {
        let score = 0;
        if (type === "reveal") score = game.reveal(r, c);
        else if (type === "flag") score = game.toggleFlag(r, c);
        else score = game.chord(r, c);

        userActions.add({
            type,
            position: { r, c },
            score,
            time: new Date().getTime(),
        });
    }

    const mouse = createDesktopMouseState({
        onReveal: (r, c) => performAction("reveal", r, c),
        onFlag: (r, c) => performAction("flag", r, c),
        onChord: (r, c) => performAction("chord", r, c),
        getBoard: () => game.board,
        isInteractive: () => game.isInteractive,
    });

    const touch = createMobileTouchState({
        onReveal: (r, c) => performAction("reveal", r, c),
        onFlag: (r, c) => performAction("flag", r, c),
        onChord: (r, c) => performAction("chord", r, c),
        getBoard: () => game.board,
        getMode: () => mobileMode,
        isInteractive: () => game.isInteractive,
    });

    function handleReset(clear = true) {
        if (clear) game.reset();
        timer.reset();
        userActions.reset();
        highlightedCell = undefined;
    }

    function pickDifficulty(d: Difficulty) {
        game.setDifficulty(d);
        view = "game";
    }

    function backToLobby() {
        view = "lobby";
        handleReset(true);
    }

    const replay = createReplayState({
        getGameStatus: () => game.gameStatus,
        reset: () => handleReset(true),
        reveal: (r, c, seed, replayMode) => game.reveal(r, c, seed, replayMode),
        chord: (r, c) => game.chord(r, c),
        toggleFlag: (r, c) => game.toggleFlag(r, c),
        addUserAction: (a) => userActions.add(a),
        setHighlightedCell: (c) => (highlightedCell = c),
        onReplayStart: () => { skipHistory = true; },
    });

    // Timer follows game status: start when entering Gaming, stop on win/lose/init. A paused
    // replay counts as stopped too -- the clock is showing the replayed game's elapsed time, and
    // letting it run while the board is frozen makes the two disagree.
    $effect(() => {
        if (game.gameStatus === GameStatus.Gaming && !replay.paused) timer.start();
        else timer.stop();
    });

    // Persist play history + leaderboard on win/lose, unless this was a replay.
    $effect(() => {
        const status = game.gameStatus;
        if (status !== GameStatus.Win && status !== GameStatus.GameOver) return;
        if (skipHistory) {
            skipHistory = false;
            return;
        }
        const actions = userActions.actions;
        if (actions.length === 0) return;

        const actionsWithDelta: UserActionDetail[] = actions.map((action, i) => ({
            ...action,
            time: i + 1 < actions.length ? actions[i + 1].time - action.time : 0,
        }));

        const entry: PlayHistory = {
            result: status === GameStatus.Win ? "Win" : "Loss",
            time: timer.seconds,
            seed: game.seed,
            actions: actionsWithDelta,
            date: new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }),
        };

        if (status === GameStatus.Win) leaderboard.add(game.difficulty, entry);
        history.addEntry(game.difficulty, entry);
    });

    // Difficulty change → reset timer + actions (game.setDifficulty already resets the board).
    // Initial mount also runs this; the resets are no-ops on a fresh state, so harmless.
    $effect(() => {
        game.difficulty;  // track only this — reset calls below don't read tracked state
        timer.reset();
        userActions.reset();
        highlightedCell = undefined;
    });

    // Retry: reset, then on next Init, click the saved first step.
    let pendingRetry = $state<{ seed: string; firstStep: Position } | null>(null);
    function onRetry(seed: string, firstStep: Position) {
        handleReset(true);
        pendingRetry = { seed, firstStep };
    }
    $effect(() => {
        if (pendingRetry && game.gameStatus === GameStatus.Init) {
            const { seed, firstStep } = pendingRetry;
            pendingRetry = null;
            game.reveal(firstStep.r, firstStep.c, seed);
            userActions.add({
                type: "reveal",
                position: firstStep,
                score: 1,
                time: new Date().getTime(),
            });
        }
    });

    const faceEmoji = $derived(
        game.gameStatus === GameStatus.GameOver
            ? "😵"
            : game.gameStatus === GameStatus.Win
                ? "😎"
                : (mouse.isPressing || touch.isPressing)
                    ? "😮"
                    : "😊"
    );

    let minWidthClass = $derived(
        game.difficulty === "easy"
            ? "easyFull:min-w-[320px]"
            : game.difficulty === "medium"
                ? "mediumFull:min-w-[512px]"
                : "hardFull:min-w-[896px]"
    );

    function preventCtx(e: MouseEvent) {
        e.preventDefault();
    }
</script>

<svelte:window oncontextmenu={preventCtx} />

{#if isPrimaryTouch && view === "game"}
    <!-- On touch in-game: replace dark mode toggle with a back button. -->
    <Button
        variant="icon"
        onclick={backToLobby}
        class="fixed top-4 left-4 z-50 shadow-lg"
        ariaLabel="Back to lobby"
    >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width={2} d="M15 19l-7-7 7-7" />
        </svg>
    </Button>
{:else}
    <DarkModeToggle />
{/if}

{#if isPrimaryTouch && view === "lobby"}
    <LobbyScreen
        leaderboards={leaderboard.boards}
        history={history.map}
        onPick={pickDifficulty}
        onShowStats={() => (showStats = true)}
        {ads}
    />
{:else}
    <main class="flex h-dvh w-dvw max-w-dvw max-h-dvh justify-center items-start lg:gap-8 gap-4 p-2 md:p-4 bg-white dark:bg-gray-900">
        <div class="flex flex-col items-center flex-1 min-w-0 {minWidthClass} min-h-[480px] h-full">
            <h1 class="hidden pointer-fine:block text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">MineSweeper</h1>

            <GameControls
                difficulty={game.difficulty}
                setDifficulty={game.setDifficulty}
                {mobileMode}
                setMobileMode={(m) => (mobileMode = m)}
                timer={timer.seconds}
                minesLeft={game.minesLeft}
                {faceEmoji}
                seed={game.seed}
                onReset={() => handleReset(true)}
                onShowStats={() => (showStats = true)}
            />

            <!-- Replay scrim: dims the whole screen, with the board lifted above it (z-50 below)
                 so it alone stays legible. Doing it this way instead of a cut-out because the
                 board sits in an overflow-auto container, which would clip any box-shadow trick
                 to the scroll box. The board gets an explicit background so the 2px grid gaps do
                 not let the scrim show through as dark lines. -->
            {#if replay.showOverlay}
                <!-- z-[55] deliberately beats the back and sidebar buttons, which are fixed z-50:
                     they would otherwise float above the scrim, undimmed and still clickable, and
                     opening the sidebar mid-replay is not something to invite. pointer-events-auto
                     so the scrim also swallows taps aimed at them; the board sits above it and
                     stays scrollable, and the control strip is higher still. -->
                <div class="fixed inset-0 z-[55] bg-slate-900/60"></div>
            {/if}

            <div class="flex-1 min-h-0 max-w-full w-fit overflow-auto {replay.showOverlay ? 'relative z-[60]' : ''}">
                <!-- w-fit h-fit so this hugs the board exactly: the frame brackets anchor to it. -->
                <div class="relative w-fit h-fit {replay.showOverlay ? 'bg-white dark:bg-gray-900' : ''}">
                    <Board {game} {mouse} {touch} {highlightedCell} />
                {#if replay.showOverlay}
                    <ReplayFrame
                        isAutoPlaying={replay.autoPlaying}
                        paused={replay.paused}
                        progress={replay.progress}
                        onCancel={replay.cancel}
                        onStart={replay.start}
                        onTogglePause={replay.togglePause}
                    />
                {/if}
                </div>
            </div>
        </div>

        <GameSidebar
            leaderboards={leaderboard.boards}
            difficulty={game.difficulty}
            userActions={userActions.actions}
            playHistory={history.map[game.difficulty] ?? []}
            setHighlightedCell={(c) => (highlightedCell = c)}
            {onRetry}
            onReplay={replay.open}
        />
    </main>
{/if}

{#if showStats}
    <StatisticsModal
        show={showStats}
        onClose={() => (showStats = false)}
        playHistoryMap={history.map}
        onClearHistory={history.clear}
        onClearLeaderboard={leaderboard.clear}
    />
{/if}


