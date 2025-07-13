import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  progress: number; // 0-100的进度百分比
  size?: 'small' | 'medium' | 'large';
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  size = 'medium', 
  showPercentage = true 
}) => {
  // 确保进度在0-100之间
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  // 根据size设置不同的高度和字体大小
  const sizeClasses = {
    small: 'h-2 text-xs',
    medium: 'h-3 text-sm',
    large: 'h-4 text-base'
  };
  
  const containerClasses = {
    small: 'gap-1',
    medium: 'gap-2', 
    large: 'gap-3'
  };

  return (
    <div className={`w-full space-y-2 ${containerClasses[size]}`}>
      {/* 进度条主体 */}
      <div className="relative">
        <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
          <div 
            className={`progress-fill h-full bg-gradient-to-r transition-all duration-700 ease-out relative overflow-hidden ${
              clampedProgress === 100 
                ? 'from-green-500 to-green-600 dark:from-green-400 dark:to-green-500' 
                : 'from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500'
            }`}
            style={{'--progress-width': `${clampedProgress}%`} as React.CSSProperties}
          >
            {/* 发光效果 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            {/* 流动光效 */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>
        </div>
        
        {/* 进度百分比显示 */}
        {showPercentage && (
          <div className={`absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2 ml-2 font-semibold text-gray-700 dark:text-gray-300 ${sizeClasses[size]}`}>
            {Math.round(clampedProgress)}%
          </div>
        )}
      </div>

      {/* 进度标记点 */}
      <div className="relative flex justify-between items-center">
        {[0, 25, 50, 75, 100].map((marker) => (
          <div key={marker} className="flex flex-col items-center">
            {/* 标记点 */}
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              clampedProgress >= marker 
                ? (marker === 100 && clampedProgress === 100)
                  ? 'bg-green-500 dark:bg-green-400 shadow-lg shadow-green-500/50 scale-125'
                  : 'bg-blue-500 dark:bg-blue-400 shadow-md shadow-blue-500/30 scale-110'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}></div>
            {/* 标记文字 */}
            <span className={`mt-1 font-medium transition-colors duration-300 ${sizeClasses[size]} ${
              clampedProgress >= marker 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              {marker}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;
