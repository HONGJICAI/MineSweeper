import React from 'react';
import { GameStats } from '../types/game';

interface GameStatsDisplayProps {
  stats: GameStats;
  onNewGame?: () => void;
  onResetGame?: () => void;
}

const GameStatsDisplay: React.FC<GameStatsDisplayProps> = ({ stats, onNewGame, onResetGame: onSolveGame }) => {
  return (
    <div className="flex gap-6 bg-gray-50 dark:bg-gray-800 rounded-[10px] p-6 min-w-[200px] justify-center items-center">
      <div className="flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.moves}</div>
        <div className="font-medium text-gray-600 dark:text-gray-400">👣</div>
      </div>
      <div className="flex gap-2 items-center">
        <button
          className="bg-gradient-to-br from-green-500 to-teal-500 border-0 rounded-lg text-white cursor-pointer text-xl p-2 transition-all duration-200 ease-linear min-w-[40px] h-[40px] flex items-center justify-center hover:-translate-y-px hover:shadow-green-glow dark:hover:shadow-green-glow-dark active:translate-y-0 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          onClick={onNewGame}
          title="开始新游戏"
          aria-label="开始新游戏"
        >
          ▶️
        </button>
        <button
          className="bg-gradient-to-br from-yellow-400 to-yellow-600 border-0 rounded-lg text-white cursor-pointer text-xl p-2 transition-all duration-200 ease-linear min-w-[40px] h-[40px] flex items-center justify-center hover:-translate-y-px hover:shadow-yellow-glow dark:hover:shadow-yellow-glow-dark active:translate-y-0 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          onClick={onSolveGame}
          title="自动解决"
          aria-label="自动解决拼图"
          disabled={stats.isCompleted}
        >
          ⏹️
        </button>
      </div>

      <div className="flex justify-between items-center">
        <div className="font-medium text-gray-600 dark:text-gray-400">⏰</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {Math.round(stats.time / 1000)}s
        </div>
      </div>

    </div>
  );
};

export default GameStatsDisplay;
