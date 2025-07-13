import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GameMode, GameStats } from '../types/game';
import { GameEngine } from '../utils/gameEngine';
import { getDefaultImageUrl } from '../utils/defaultImages';
import GameBoard from './GameBoard';
import GameStatsDisplay from './GameStatsDisplay';
import ProgressBar from './ProgressBar';
import GameControl from './GameControl';

interface SlidingPuzzleProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

const SlidingPuzzle: React.FC<SlidingPuzzleProps> = ({ mode, onModeChange }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const board = GameEngine.createSolvedBoard(3);
    return {
      board,
      size: 3,
      emptyIndex: board.indexOf(null),
      moves: 0,
      startTime: null,
      endTime: null,
      isCompleted: true,
    };
  });

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<string>(() => {
    // 如果初始模式是图片模式，则设置默认图片
    return mode === 'image' ? getDefaultImageUrl('simple') : '';
  });
  const [showNumbers, setShowNumbers] = useState<boolean>(false);

  // 当模式切换到图片模式时，如果没有选择图片则设置默认图片
  useEffect(() => {
    if (mode === 'image' && !selectedImage) {
      setSelectedImage(getDefaultImageUrl('simple'));
    }
  }, [mode]);

  // 时间计时器
  useEffect(() => {
    let interval: number;

    if (gameState.startTime && !gameState.isCompleted) {
      interval = setInterval(() => {
        setCurrentTime((t) => t + 1000);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [gameState.startTime, gameState.isCompleted]);

  const handleTileClick = useCallback((index: number) => {
    setGameState(prevState => {
      if (prevState.isCompleted) return prevState;

      return GameEngine.moveTile(prevState, index);
    });
  }, []);

  const handleRestart = useCallback(() => {
    const board = GameEngine.createBoard(gameState.size);
    setGameState({
      board,
      size: gameState.size,
      emptyIndex: board.indexOf(null),
      moves: 0,
      startTime: Date.now(),
      endTime: null,
      isCompleted: false,
    });
    setCurrentTime(0);
  }, [gameState.size]);

  // 开始新游戏（从统计面板触发）
  const handleNewGame = useCallback(() => {
    handleRestart();
  }, [handleRestart]);

  const handleResetGame = useCallback(() => {
    if (gameState.isCompleted) return;
    
    const solvedBoard = GameEngine.createSolvedBoard(gameState.size);
    setGameState(prevState => ({
      ...prevState,
      moves: 0,
      startTime: null,
      endTime: null,
      board: solvedBoard,
      emptyIndex: solvedBoard.indexOf(null),
      isCompleted: true,
      // 保持开始时间和移动次数不变
    }));
    setCurrentTime(0);
  }, [gameState.size, gameState.isCompleted]);

  // 改变游戏大小
  const handleSizeChange = useCallback((size: number) => {
    const board = GameEngine.createBoard(size);
    setGameState({
      board,
      size,
      emptyIndex: board.indexOf(null),
      moves: 0,
      startTime: null,
      endTime: null,
      isCompleted: true,
    });
    setCurrentTime(0);
  }, []);

  // 处理模式切换
  const handleModeChange = useCallback((newMode: GameMode) => {
    onModeChange(newMode);
    
    // 如果切换到number模式，清除图片选择
    if (newMode === 'number') {
      setSelectedImage('');
    }
    
    // 切换模式时重置游戏
    const board = GameEngine.createBoard(gameState.size);
    setGameState({
      board,
      size: gameState.size,
      emptyIndex: board.indexOf(null),
      moves: 0,
      startTime: Date.now(),
      endTime: null,
      isCompleted: false,
    });
    setCurrentTime(0);
  }, [onModeChange, gameState.size]);

  // 处理图片上传
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setSelectedImage(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const gameStats: GameStats = {
    moves: gameState.moves,
    time: gameState.isCompleted ?
      (gameState.endTime! - gameState.startTime!) :
      (gameState.startTime ? currentTime : 0),
    isCompleted: gameState.isCompleted,
  };

  return (
    <div className="p-4 max-w-[1200px] mx-auto min-h-screen">
      <div className="flex justify-center items-center flex-wrap gap-4">
        <h1 className="flex justify-center text-center m-1.5 text-2xl font-bold text-gray-900 dark:text-gray-100">滑动拼图</h1>
      </div>

      <div className="flex justify-center">
        <div className="flex gap-2 items-center flex-col">
          <GameControl 
            mode={mode} 
            onModeChange={handleModeChange}
            gameSize={gameState.size}
            onGameSizeChange={handleSizeChange}
            selectedImage={selectedImage}
            onImageChange={setSelectedImage}
            onImageUpload={handleImageUpload}
            showNumbers={showNumbers}
            onShowNumbersChange={setShowNumbers}
          />
          <GameStatsDisplay 
            stats={gameStats} 
            onNewGame={handleNewGame}
            onResetGame={handleResetGame}
          />
          <GameBoard
            gameState={gameState}
            mode={mode}
            selectedImage={selectedImage}
            showNumbers={showNumbers}
            onTileClick={handleTileClick}
          />

          <ProgressBar progress={GameEngine.getCompletionProgress(gameState.board)} />
        </div>
      </div>
    </div>
  );
};

export default SlidingPuzzle;
