import React, { useCallback, useState } from 'react';
import { Button, Modal } from '@caiji-games/shared-ui';

interface AutoGamingOverlayProps {
  isAutoPlaying: boolean;
  onCancelAutoPlay: () => void;
  onStartAutoPlay?: (speed: number) => void;
  title?: string;
}

const cornerBase = "absolute w-10 h-10 border-2 border-blue-500 dark:border-blue-400 pointer-events-none";

const AutoGamingOverlay: React.FC<AutoGamingOverlayProps> = ({
  isAutoPlaying,
  onCancelAutoPlay,
  onStartAutoPlay,
  title,
}) => {
  const [speedOption, setSpeedOption] = useState<'custom' | 'gamer'>('gamer');
  const [customSpeed, setCustomSpeed] = useState<number>(500);

  const handlePlay = useCallback(() => {
    const speed = speedOption === 'custom' ? customSpeed : -1;
    onStartAutoPlay?.(speed);
  }, [speedOption, customSpeed, onStartAutoPlay]);

  const handlePickGamer = useCallback(() => setSpeedOption('gamer'), []);
  const handlePickCustom = useCallback(() => setSpeedOption('custom'), []);

  const handleCustomSpeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSpeed(Number(e.target.value));
  }, []);

  return (
    <div className="absolute inset-0 z-[1000] animate-fade-in">
      {/* Three L-shaped corner brackets — the fourth (top-right) is the cancel button */}
      <div className={`${cornerBase} top-3 left-3 border-r-0 border-b-0`} />
      <div className={`${cornerBase} bottom-3 left-3 border-r-0 border-t-0`} />
      <div className={`${cornerBase} bottom-3 right-3 border-l-0 border-t-0`} />

      <button
        onClick={onCancelAutoPlay}
        aria-label="Cancel replay"
        title="Cancel replay"
        className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-md border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-500/15 dark:hover:bg-blue-400/15 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="absolute top-4 left-[60px] flex items-center gap-2 pointer-events-none">
        <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-blink" />
        <span className="text-blue-600 dark:text-blue-400 text-sm font-medium tracking-wider">
          {title || 'REPLAY'}
        </span>
      </div>

      <Modal show={!isAutoPlaying} onClose={onCancelAutoPlay} title="Replay Speed">
        <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button active={speedOption === 'gamer'} onClick={handlePickGamer} className="flex-1">
                🎮 Your speed
              </Button>
              <Button active={speedOption === 'custom'} onClick={handlePickCustom} className="flex-1">
                ⚙️ Custom
              </Button>
            </div>

            {speedOption === 'custom' && (
              <div className="flex items-center gap-2 px-1">
                <input
                  type="number"
                  min="100"
                  max="1000"
                  step="100"
                  value={customSpeed}
                  onChange={handleCustomSpeedChange}
                  className="w-24 px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">ms per step</span>
              </div>
            )}

            <Button variant="primary" size="lg" onClick={handlePlay} className="w-full">
              ▶ Go
            </Button>
          </div>
        </Modal>
    </div>
  );
};

export default AutoGamingOverlay;
