export const DEFAULT_IMAGES = {  
  simple: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgICAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNlNzRjM2MiLz4KICAgICAgPGNpcmNsZSBjeD0iMTUwIiBjeT0iMTUwIiByPSIxMDAiIGZpbGw9IiMzNDk4ZGIiLz4KICAgICAgPHBvbHlnb24gcG9pbnRzPSIxNTAsNTAgMjUwLDI1MCA1MCwyNTAiIGZpbGw9IiNmMzljMTIiLz4KICAgIDwvc3ZnPg==',
};

export const getDefaultImageUrl = (imageName: keyof typeof DEFAULT_IMAGES): string => {
  return DEFAULT_IMAGES[imageName];
};
