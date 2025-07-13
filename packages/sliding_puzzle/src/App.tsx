import { useState } from 'react';
import SlidingPuzzle from "./components/SlidingPuzzle";
import { GameMode } from './types/game';
import "./App.css";
import DarkModeToggle from './components/DarkModeToggle';

function App() {
  const [mode, setMode] = useState<GameMode>('number');

  return (
    <main className="">
      <DarkModeToggle />
      <SlidingPuzzle mode={mode} onModeChange={setMode} />
    </main>
  );
}

export default App;
