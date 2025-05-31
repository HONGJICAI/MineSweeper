import React, { useMemo, useState, useCallback } from "react";
import Leaderboard from "./Leaderboard";
import ActionList from "./ActionList";
import PlayHistoryList from "./PlayHistoryList";
import { Difficulty, PlayHistory, Position, UserActionDetail } from "./Game.types";
import { Leaderboards } from "./hooks/useLeaderboard";

type GameSidebarProps = {
    leaderboards: Leaderboards | null;
    difficulty: "easy" | "medium" | "hard";
    userActions: UserActionDetail[];
    setHighlightedCell: (cell?: Position ) => void;
    playHistory: PlayHistory[] | null;
    onRetry: (seed: string, difficulty: Difficulty, firstStep: Position) => void;
    onReplay: (seed: string, difficulty: Difficulty, actions: UserActionDetail[]) => void;
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
    const handleRetry = useCallback((seed: string, difficulty: Difficulty, firstStep: Position) => {
        onRetry(seed, difficulty, firstStep);
        setIsOpen(false);
        setActiveTab("actions");
    }, [onRetry]);
    const handleReplay = useCallback((seed: string, difficulty: Difficulty, actions: UserActionDetail[]) => {
        onReplay(seed, difficulty, actions);
        setIsOpen(false);
        setActiveTab("actions");
    }, [onReplay]);

    const currentHistory = useMemo(() => {
        return playHistory?.filter(entry => entry.difficulty === difficulty) ?? null;
    }, [playHistory, difficulty]);

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
                    className="flex-1 overflow-y-auto overflow-x-hidden"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    }}
                >
                    <style jsx>{`
                        div::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
                    {activeTab === "actions" ? (
                        <ActionList userActions={userActions} setHoveredCell={setHighlightedCell} />
                    ) : (
                        <PlayHistoryList playHistory={currentHistory} onRetry={handleRetry} onReplay={handleReplay} />
                    )}
                </div>
            </div>
        </>
        , [leaderboards, difficulty, userActions, activeTab, setHighlightedCell, handleActionsClick, handleHistoryClick, handleRetry, handleReplay, currentHistory]);

    return (
        <>
            <style jsx>{`
                @keyframes slideEmoji {
                    0%, 45% {
                        transform: translateY(0%);
                    }
                    50%, 95% {
                        transform: translateY(-100%);
                    }
                    100% {
                        transform: translateY(0%);
                    }
                }
                
                .emoji-slider {
                    animation: slideEmoji 4s infinite;
                }
            `}</style>

            {/* Mobile floating button - only visible on small screens */}
            <button
                onClick={handleOpenSidebar}
                className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200 shadow-lg"
                aria-label="Open sidebar"
            >
                <div className="relative w-6 h-6 overflow-hidden">
                    <div className="emoji-slider absolute inset-0 flex flex-col">
                        <span className="h-6 flex items-center justify-center">🏆</span>
                        <span className="h-6 flex items-center justify-center">📋</span>
                    </div>
                </div>
            </button>

            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50"
                    onClick={handleCloseSidebar}
                />
            )}

            {/* Sidebar - responsive positioning */}
            <div
                className={`
                    /* Mobile styles */
                    fixed lg:relative
                    right-0 lg:right-auto
                    top-0 lg:top-auto
                    h-screen lg:h-[calc(100vh-2rem)]
                    w-[280px] lg:w-[250px]
                    bg-white dark:bg-gray-800
                    shadow-2xl lg:shadow-none
                    z-50 lg:z-auto
                    transform transition-transform duration-300 
                    ${isOpen ? "translate-x-0" : "translate-x-full"}
                    lg:translate-x-0
                    
                    /* Desktop styles */
                    p-4 lg:p-0
                `}
            >
                {/* Close button - only visible on mobile */}
                <button
                    onClick={handleCloseSidebar}
                    className="lg:hidden absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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