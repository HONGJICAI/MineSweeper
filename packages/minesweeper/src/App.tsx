import { useCallback } from "react";
import Game from "./app/Game";
import DarkModeToggle from "./app/components/DarkModeToggle";

function App() {
  const onContextMenu = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      e.preventDefault();
    },
    []
  );

  return (
    <div className="antialiased bg-white dark:bg-gray-900">
      {import.meta.env.VITE_PLATFORM === 'web' && (
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3787906327972254" crossOrigin="anonymous"></script>
      )}
      <span onContextMenu={onContextMenu}>
        <DarkModeToggle />
        <Game difficulty={'easy'} />
      </span>
    </div>
  );
}

export default App;
