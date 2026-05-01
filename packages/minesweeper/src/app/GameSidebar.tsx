import React, { useMemo, useState, useCallback } from "react";
import Leaderboard from "./Leaderboard";
import ActionList from "./ActionList";
import PlayHistoryList from "./PlayHistoryList";
import { PlayHistory, Position, UserActionDetail } from "./Game.types";
import { Leaderboards } from "./hooks/useLeaderboard";
import styles from "./GameSidebar.module.css";

type GameSidebarProps = {
    leaderboards: Leaderboards | null;
    difficulty: "easy" | "medium" | "hard";
    userActions: UserActionDetail[];
    setHighlightedCell: (cell?: Position) => void;
    playHistory: PlayHistory[] | null;
    onRetry: (seed: string, firstStep: Position) => void;
    onReplay: (seed: string, actions: UserActionDetail[]) => void;
};

const GameSidebar = React.memo(function GameSidebar({
    leaderboards,
    difficulty,
    userActions,
    setHighlightedCell,
    playHistory,
    onRetry,
    onReplay,
}: GameSidebarProps) {
    const [activeTab, setActiveTab] = useState<"actions" | "history">("actions");
    const [isOpen, setIsOpen] = useState(false);

    const handleActionsClick = useCallback(() => setActiveTab("actions"), []);
    const handleHistoryClick = useCallback(() => setActiveTab("history"), []);
    const handleOpenSidebar = useCallback(() => setIsOpen(true), []);
    const handleCloseSidebar = useCallback(() => setIsOpen(false), []);
    const handleRetry = useCallback((seed: string, firstStep: Position) => {
        onRetry(seed, firstStep);
        setIsOpen(false);
        setActiveTab("actions");
    }, [onRetry]);
    const handleReplay = useCallback((seed: string, actions: UserActionDetail[]) => {
        onReplay(seed, actions);
        setIsOpen(false);
        setActiveTab("actions");
    }, [onReplay]);
    const hiddenClass = useMemo(() => {
        switch(difficulty) {
            case "easy": return "easyFull:hidden";
            case "medium": return "mediumFull:hidden";
            case "hard": return "hardFull:hidden";
        }
    }, [difficulty])
    const layoutClass = useMemo(() => {
        switch (difficulty) {
            case "easy":
                return "easyFull:relative easyFull:right-auto easyFull:top-auto easyFull:z-auto easyFull:translate-x-0 easyFull:shadow-none easyFull:h-[calc(100vh-2rem)]";
            case "medium":
                return "mediumFull:relative mediumFull:right-auto mediumFull:top-auto mediumFull:z-auto mediumFull:translate-x-0 mediumFull:shadow-none mediumFull:h-[calc(100vh-2rem)]";
            case "hard":
                return "hardFull:relative hardFull:right-auto hardFull:top-auto hardFull:z-auto hardFull:translate-x-0 hardFull:shadow-none hardFull:h-[calc(100vh-2rem)]";
        }
    }, [difficulty]);

    const sidebarContent = useMemo(() =>
        <>
            <Leaderboard leaderboards={leaderboards} difficulty={difficulty} onReplay={handleReplay} onRetry={handleRetry} />

            <div className="flex flex-col h-full overflow-hidden">
                {/* Tab Headers */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleActionsClick}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === "actions"
                            ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        🕹️Actions
                    </button>
                    <button
                        onClick={handleHistoryClick}
                        className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${activeTab === "history"
                            ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                    >
                        📜History
                    </button>
                </div>

                {/* Tab Content */}
                <div
                    className={`flex-1 overflow-y-auto overflow-x-hidden ${styles.scrollbarHidden}`}
                >
                    {activeTab === "actions" ? (
                        <ActionList userActions={userActions} setHoveredCell={setHighlightedCell} />
                    ) : (
                        <PlayHistoryList playHistory={playHistory} onRetry={handleRetry} onReplay={handleReplay} />
                    )}
                </div>
            </div>
        </>
        , [leaderboards, difficulty, userActions, activeTab, setHighlightedCell, handleActionsClick, handleHistoryClick, handleRetry, handleReplay, playHistory]);

    return (
        <>

            {/* Mobile floating button - only visible on small screens */}
            <button
                onClick={handleOpenSidebar}
                className={`${hiddenClass} fixed top-4 right-4 z-50 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200 shadow-lg`}
                aria-label="Open sidebar"
            >
                <div className="relative w-6 h-6 overflow-hidden">
                    <div className={`${styles.emojiSlider} absolute inset-0 flex flex-col`}>
                        <span className="h-6 flex items-center justify-center">🏆</span>
                        <span className="h-6 flex items-center justify-center">📋</span>
                    </div>
                </div>
            </button>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className={`${hiddenClass} fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50`}
                    onClick={handleCloseSidebar}
                />
            )}

            {/* Sidebar - responsive positioning */}
            <div
                className={`
                    fixed right-0 top-0 z-50 h-screen w-[250px]
                    bg-white dark:bg-gray-800
                    shadow-2xl
                    transform transition-transform duration-300 
                    ${isOpen ? "translate-x-0" : "translate-x-full"}
                    p-4
                    ${layoutClass}
                `}
            >
                {/* Close button - only visible on mobile */}
                <button
                    onClick={handleCloseSidebar}
                    className={`${hiddenClass} absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200`}
                    aria-label="Close sidebar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="grid grid-rows-[max-content_1fr] gap-0 h-full">
                    {sidebarContent}
                </div>
            </div>
        </>
    );
});

export default GameSidebar;