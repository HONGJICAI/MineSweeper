import React, { useEffect, useMemo } from 'react';
import { GameState, GameMode } from '../types/game';
import { setupImageTiles, clearImageTiles } from '../utils/imageUtils';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  mode: GameMode;
  selectedImage?: string;
  showNumbers?: boolean;
  onTileClick: (index: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  mode,
  selectedImage,
  showNumbers = false,
  onTileClick
}) => {
  const { board, size } = gameState;

  // 设置图片背景
  useEffect(() => {
    if (mode === 'image' && selectedImage) {
      setupImageTiles();
    } else {
      // 当不是图片模式或没有选择图片时，清除所有背景
      clearImageTiles();
    }
  }, [mode, selectedImage, board]);

  const getTileContent = (tile: number | null, index: number) => {
    // 如果游戏完成且这是最后一个位置（应该是空白块的位置）
    if (gameState.isCompleted && index === board.length - 1 && tile === null) {
      // 显示最后一个数字（对于3x3是9，4x4是16等）
      const lastNumber = gameState.size * gameState.size;
      if (mode === 'number' || !selectedImage) {
        return lastNumber;
      } else {
        // 图片模式 - 根据showNumbers决定是否显示数字
        return showNumbers ? lastNumber : null;
      }
    }

    if (tile === null) return null;

    if (mode === 'number' || !selectedImage) {
      return tile;
    } else {
      // 图片模式 - 根据showNumbers决定是否显示数字
      return showNumbers ? tile : null;
    }
  };

  const handleTileClick = (index: number) => {
    const tile = board[index];
    if (tile !== null) {
      onTileClick(index);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTileClick(index);
    }
  };

  const tiles = useMemo(() =>
    board.map((tile, index) => {
      // 如果游戏完成且这是最后一个位置（空白块位置），使用最后一个数字来计算背景位置
      const isCompletedEmptyTile = gameState.isCompleted && index === board.length - 1 && tile === null;
      const displayTile = isCompletedEmptyTile ? gameState.size * gameState.size : tile;

      // 对于图片模式，确保完成后的空白块也显示图片
      let row = 0;
      let col = 0;

      if (displayTile) {
        row = Math.floor((displayTile - 1) / size);
        col = (displayTile - 1) % size;
      }

      return (
        <div
          key={index}
          className={`tile ${tile === null ? (isCompletedEmptyTile ? 'empty completed-empty' : 'empty') : ''} ${mode === 'image' && selectedImage ? 'image-tile' : 'number-tile'
            }`}
          onClick={() => handleTileClick(index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          tabIndex={tile !== null ? 0 : -1}
          role="button"
          aria-label={tile !== null ? `移动拼图块 ${tile}` : '空格'}
          data-bg-image={mode === 'image' && selectedImage ? selectedImage : ''}
          data-bg-row={row}
          data-bg-col={col}
          data-bg-size={size}
        >
          {getTileContent(tile, index)}
        </div>
      );
    })
    , [board, size, mode, selectedImage, gameState.isCompleted]);

  return (
    <div className="game-board-container">
      <div
        className={`game-board size-${size}`}
        data-grid-size={size}
      >
        {tiles}
      </div>
    </div>
  );
};

export default GameBoard;
