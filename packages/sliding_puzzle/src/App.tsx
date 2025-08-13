import { useState } from 'react';
import SlidingPuzzle from "./components/SlidingPuzzle";
import { GameMode } from './types/game';
import { DarkModeToggle } from '@caiji-games/shared-ui';

function App() {
  const [mode, setMode] = useState<GameMode>('number');

  return (
    <div className="antialiased bg-white dark:bg-gray-900">
      <DarkModeToggle />
      <SlidingPuzzle mode={mode} onModeChange={setMode} />
    </div>
  );
}

export default App;
