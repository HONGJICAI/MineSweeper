import React from 'react';
import { GameStats } from '../types/game';
import { EmojiBtn } from '@caiji-games/shared-ui';

interface GameStatsDisplayProps {
  stats: GameStats;
  onNewGame?: () => void;
  onResetGame?: () => void;
}

const GameStatsDisplay: React.FC<GameStatsDisplayProps> = ({ stats, onNewGame, onResetGame }) => {
  return (
    <div className="flex gap-6 rounded-[10px] p-6 min-w-[200px] justify-center items-center">
      <div className="flex justify-between items-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.moves}</div>
        <div className="font-medium text-gray-600 dark:text-gray-400">👣</div>
      </div>
      <div className="flex gap-2 items-center">
          <EmojiBtn
            emoji={stats.isCompleted ? "▶️" : "🔄"}
            onClick={onNewGame}
            title="Start"
            ariaLabel="Start"
          />
        <EmojiBtn
          emoji="⏹️"
          onClick={onResetGame}
          title="Reset"
          ariaLabel="Reset"
          disabled={stats.isCompleted}
        />
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
