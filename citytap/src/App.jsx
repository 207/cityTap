import { useState } from 'react';
import MainMenu from './components/MainMenu';
import CityTapGame from './components/CityTapGame';
import MapZoomGame from './components/MapZoomGame';
import './App.css';

function App() {
  const [game, setGame] = useState(null);

  if (!game) {
    return <MainMenu onPick={setGame} />;
  }

  if (game === 'mapzoom') {
    return <MapZoomGame onBack={() => setGame(null)} />;
  }

  return <CityTapGame onBack={() => setGame(null)} />;
}

export default App;
