import React, { useCallback, useState } from 'react';
import './AutoGamingOverlay.css';
import Modal from './components/Modal';

interface AutoGamingOverlayProps {
  isAutoPlaying: boolean;
  onCancelAutoPlay: () => void;
  onStartAutoPlay?: (speed: number) => void;
  title?: string;
}

const AutoGamingOverlay: React.FC<AutoGamingOverlayProps> = ({
  isAutoPlaying,
  onCancelAutoPlay,
  onStartAutoPlay,
  title,
}) => {
  const [speedOption, setSpeedOption] = useState<'custom' | 'gamer'>('gamer');
  const [customSpeed, setCustomSpeed] = useState<number>(500);

  const handlePlay = useCallback(() => {
    const speed = speedOption === 'custom' ? customSpeed : -1; // -1 indicates using gamer's speed
    onStartAutoPlay?.(speed);
  }, [speedOption, customSpeed, onStartAutoPlay]);

  const handleSpeedOptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSpeedOption(e.target.value as 'custom' | 'gamer');
  }, []);

  const handleCustomSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSpeed(Number(e.target.value));
  }, []);

  return (
    <div className="auto-gaming-overlay">
      <div className="replay-indicator">
        <div className="replay-dot"></div>
        <span className="replay-text">{title || 'REPLAY'}</span>
      </div>
        <div className="overlay-content">
          <Modal show={!isAutoPlaying} onClose={onCancelAutoPlay} title="Auto Gaming Options">
            <div className="flex gap-6">
              {/* Left side - Options */}
              <div className="flex-1 speed-options dark:text-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Playing Speed</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-3 rounded-lg transition-colors">
                    <input
                      type="radio"
                      name="speed"
                      value="gamer"
                      checked={speedOption === 'gamer'}
                      onChange={handleSpeedOptionChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-base">Your speed</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-3 rounded-lg transition-colors">
                    <input
                      type="radio"
                      name="speed"
                      value="custom"
                      checked={speedOption === 'custom'}
                      onChange={handleSpeedOptionChange}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-base">Custom</span>
                    <input
                      type="number"
                      min="100"
                      max="1000"
                      step="100"
                      value={customSpeed}
                      onChange={handleCustomSpeedChange}
                      disabled={speedOption !== 'custom'}
                      className="speed-input w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-700 dark:text-white transition-all text-sm"
                      placeholder="ms"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">ms</span>
                  </label>
                </div>
              </div>

              {/* Right side - Go button */}
              <div className="flex items-center">
                <button
                  className="play-button px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={handlePlay}
                >
                  Go
                </button>
              </div>
            </div>
          </Modal>
        </div>
    </div>
  );
};

export default AutoGamingOverlay;