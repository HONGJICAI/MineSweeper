import React from 'react';
import { GameMode } from '../types/game';
import GameSettings from './GameSettings';

interface GameControlProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  gameSize: number;
  onGameSizeChange: (size: number) => void;
  selectedImage: string;
  onImageChange: (image: string) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showNumbers: boolean;
  onShowNumbersChange: (show: boolean) => void;
}

const GameControl: React.FC<GameControlProps> = ({
  mode,
  onModeChange,
  gameSize,
  onGameSizeChange,
  selectedImage,
  onImageChange,
  onImageUpload,
  showNumbers,
  onShowNumbersChange
}) => {
  return (
    <div className="flex items-center gap-4">
      {/* 模式控制按钮 */}
      <div className="flex gap-2">
        <button
          className={`flex items-center justify-center min-w-[48px] h-12 px-4 py-2 rounded-lg border transition-all duration-200 text-lg font-medium ${
            mode === 'number' 
              ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-md' 
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600'
          }`}
          onClick={() => onModeChange('number')}
          title="数字模式"
          aria-label="切换到数字模式"
        >
          🔢
        </button>
        <button
          className={`flex items-center justify-center min-w-[48px] h-12 px-4 py-2 rounded-lg border transition-all duration-200 text-lg font-medium ${
            mode === 'image' 
              ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500 shadow-md' 
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600'
          }`}
          onClick={() => onModeChange('image')}
          title="图片模式"
          aria-label="切换到图片模式"
        >
          🖼️
        </button>
      </div>

      {/* 游戏设置 */}
      <GameSettings
        mode={mode}
        gameSize={gameSize}
        onGameSizeChange={onGameSizeChange}
        selectedImage={selectedImage}
        onImageChange={onImageChange}
        onImageUpload={onImageUpload}
        showNumbers={showNumbers}
        onShowNumbersChange={onShowNumbersChange}
      />
    </div>
  );
};

export default GameControl;