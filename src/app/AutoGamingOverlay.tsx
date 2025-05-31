import React from 'react';
import './AutoGamingOverlay.css';

interface AutoGamingOverlayProps {
  isAutoPlaying: boolean;
  onCancelAutoPlay?: () => void;
  title?: string;
}

const AutoGamingOverlay: React.FC<AutoGamingOverlayProps> = ({
  isAutoPlaying,
  title,
}) => {
  if (!isAutoPlaying) return null;

  return (
    <div className="auto-gaming-overlay">
      <div className="replay-indicator">
        <div className="replay-dot"></div>
        <span className="replay-text">{title || 'REPLAY'}</span>
      </div>
      <div className="overlay-content">
        {/* <div className="cancel-button-container">
          <button 
            className="cancel-button"
            onClick={onCancelAutoPlay}
          >
            Stop
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default AutoGamingOverlay;