import React, { useCallback, useState } from 'react';
import { Modal } from '@caiji-games/shared-ui';

interface AutoGamingOverlayProps {
  isAutoPlaying: boolean;
  onCancelAutoPlay: () => void;
  onStartAutoPlay?: (speed: number) => void;
  title?: string;
}

const cornerBase = "absolute w-[60px] h-[60px] border-[3px] border-red-500 pointer-events-none";

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
    <div className="absolute inset-0 z-[1000] animate-fade-in">
      {/* Four L-shaped corner brackets */}
      <div className={`${cornerBase} top-5 left-5 border-r-0 border-b-0`} />
      <div className={`${cornerBase} top-5 right-5 border-l-0 border-b-0`} />
      <div className={`${cornerBase} bottom-5 left-5 border-r-0 border-t-0`} />
      <div className={`${cornerBase} bottom-5 right-5 border-l-0 border-t-0`} />

      <div className="absolute top-[30px] left-[90px] flex items-center gap-[10px] pointer-events-none">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-blink" />
        <span className="text-red-500 text-lg font-bold font-mono tracking-[2px] [text-shadow:0_0_4px_rgba(255,0,0,0.5)]">
          {title || 'REPLAY'}
        </span>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <Modal show={!isAutoPlaying} onClose={onCancelAutoPlay} title="Replaying Options">
          <div className="flex gap-6">
            {/* Left side - Options */}
            <div className="flex-1 dark:text-gray-100">
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
                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-700 dark:text-white transition-all text-sm"
                    placeholder="ms"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">ms</span>
                </label>
              </div>
            </div>

            {/* Right side - Go button */}
            <div className="flex items-center">
              <button
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
