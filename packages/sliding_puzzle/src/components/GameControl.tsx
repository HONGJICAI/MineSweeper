import React from 'react';
import { GameMode } from '../types/game';
import GameSettings from './GameSettings';
import { EmojiBtn } from '@caiji-games/shared-ui';

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
        <EmojiBtn
          emoji="🔢"
          onClick={() => onModeChange('number')}
          title="数字模式"
          ariaLabel='切换到数字模式'
        />
        <EmojiBtn
          emoji="🖼️"
          onClick={() => onModeChange('image')}
          title="图片模式"
          ariaLabel='切换到图片模式'
        />
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