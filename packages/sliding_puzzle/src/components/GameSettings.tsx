import React, { useState } from 'react';
import { getDefaultImageUrl } from '../utils/defaultImages';
import { GameMode } from '../types/game';
import { Modal } from '@caiji-games/shared-ui';

interface GameSettingsProps {
  mode: GameMode;
  gameSize: number;
  onGameSizeChange: (size: number) => void;
  selectedImage: string;
  onImageChange: (image: string) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  showNumbers: boolean;
  onShowNumbersChange: (show: boolean) => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({
  mode,
  gameSize,
  onGameSizeChange,
  selectedImage,
  onImageChange,
  onImageUpload,
  showNumbers,
  onShowNumbersChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      <button
        className="fixed top-4 right-4 z-40 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200 shadow-lg"
        onClick={() => setIsExpanded(!isExpanded)}
        title="游戏设置"
        aria-label="打开游戏设置"
      >
        <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </button>

      <Modal
        show={isExpanded}
        onClose={() => setIsExpanded(false)}
        title="游戏设置"
      >
        <div className="space-y-6">
          {/* 游戏大小设置 */}
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">游戏大小</h4>
            <select
              value={gameSize}
              onChange={(e) => onGameSizeChange(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="选择游戏大小"
            >
              <option value={3}>3×3</option>
              <option value={4}>4×4</option>
              <option value={5}>5×5</option>
            </select>
          </div>

          {/* 图片模式特有设置 */}
          {mode === 'image' && (
            <>
              {/* 显示选项 */}
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">显示选项</h4>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNumbers}
                    onChange={(e) => onShowNumbersChange(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-900 dark:text-gray-100">显示数字</span>
                </label>
              </div>

              {/* 图片选择 */}
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">图片选择</h4>

                {/* 图片选择按钮 */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                    onClick={() => {
                      const imageUrl = getDefaultImageUrl('simple');
                      onImageChange(imageUrl);
                    }}
                  >
                    简单图
                  </button>

                  <label className="px-3 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 cursor-pointer text-center">
                    上传图
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onImageUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    className="px-3 py-2 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200"
                    onClick={() => {
                      // TODO: 实现Bing图片选择功能
                      console.log('Bing图片选择功能待实现');
                    }}
                  >
                    Bing图
                  </button>
                </div>

                {/* 图片预览 */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">预览</h5>
                  <div className="w-full h-32 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                    {selectedImage ? (
                      <img
                        src={selectedImage}
                        alt="Selected"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        <div className="text-2xl mb-2">📷</div>
                        <p className="text-sm">选择图片预览</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default GameSettings;
