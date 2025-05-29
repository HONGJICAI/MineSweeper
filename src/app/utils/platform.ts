// Platform detection and Tauri API wrapper

export const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export const setWindowSize = async (width: number, height: number) => {
  if (!isTauri()) return;
  
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const { LogicalSize } = await import('@tauri-apps/api/dpi');
    await getCurrentWindow().setSize(new LogicalSize(width, height));
  } catch (error) {
    console.warn('Failed to set window size:', error);
  }
};