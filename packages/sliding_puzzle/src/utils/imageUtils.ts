// 清除所有瓦片的背景图片
export const clearImageTiles = () => {
  const tiles = document.querySelectorAll('.tile:not(.empty)');
  tiles.forEach((tile) => {
    const htmlTile = tile as HTMLElement;
    htmlTile.style.backgroundImage = '';
    htmlTile.style.backgroundSize = '';
    htmlTile.style.backgroundPosition = '';
    htmlTile.style.backgroundRepeat = '';
  });
  
  // 清除空白瓦片的特殊样式
  const emptyTiles = document.querySelectorAll('.tile.empty');
  emptyTiles.forEach((tile) => {
    const htmlTile = tile as HTMLElement;
    htmlTile.style.backgroundColor = '';
    htmlTile.style.backgroundImage = '';
    htmlTile.style.backgroundSize = '';
    htmlTile.style.backgroundPosition = '';
  });
};

// 处理图片拼图的背景设置
export const setupImageTiles = () => {
  // 处理普通拼图块（不包括空白块）
  const tiles = document.querySelectorAll('.tile[data-bg-image]:not(.empty), .tile[data-bg-image].completed-empty');
  
  // 先清除所有tile的背景
  document.querySelectorAll('.tile:not(.empty), .tile.completed-empty').forEach((tile) => {
    const htmlTile = tile as HTMLElement;
    htmlTile.style.backgroundImage = '';
    htmlTile.style.backgroundSize = '';
    htmlTile.style.backgroundPosition = '';
    htmlTile.style.backgroundColor = '';
  });
  
  tiles.forEach((tile) => {
    const htmlTile = tile as HTMLElement;
    const bgImage = htmlTile.dataset.bgImage;
    const bgRow = parseInt(htmlTile.dataset.bgRow || '0');
    const bgCol = parseInt(htmlTile.dataset.bgCol || '0');
    const bgSize = parseInt(htmlTile.dataset.bgSize || '3');
    
    if (bgImage && bgImage !== '') {
      // 临时禁用过渡效果，避免背景图片位置变化时的滑动效果
      const originalTransition = htmlTile.style.transition;
      htmlTile.style.transition = 'none';
      
      const backgroundPositionX = (bgCol / (bgSize - 1)) * 100;
      const backgroundPositionY = (bgRow / (bgSize - 1)) * 100;
      
      htmlTile.style.backgroundImage = `url(${bgImage})`;
      htmlTile.style.backgroundSize = `${bgSize * 100}% ${bgSize * 100}%`;
      htmlTile.style.backgroundPosition = `${backgroundPositionX}% ${backgroundPositionY}%`;
      htmlTile.style.backgroundRepeat = 'no-repeat';
      
      // 恢复过渡效果
      requestAnimationFrame(() => {
        htmlTile.style.transition = originalTransition;
      });
    } else {
      // 清除背景
      htmlTile.style.backgroundImage = '';
      htmlTile.style.backgroundSize = '';
      htmlTile.style.backgroundPosition = '';
    }
  });

  // 处理普通空白瓦片（非完成状态），设置为黑色
  const emptyTiles = document.querySelectorAll('.tile.empty:not(.completed-empty)');
  emptyTiles.forEach((tile) => {
    const htmlTile = tile as HTMLElement;
    // 临时禁用过渡效果
    const originalTransition = htmlTile.style.transition;
    htmlTile.style.transition = 'none';
    
    htmlTile.style.backgroundColor = '#000000';
    htmlTile.style.backgroundImage = '';
    htmlTile.style.backgroundSize = '';
    htmlTile.style.backgroundPosition = '';
    
    // 恢复过渡效果
    requestAnimationFrame(() => {
      htmlTile.style.transition = originalTransition;
    });
  });
};
