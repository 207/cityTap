import { useCallback, useState } from 'react';
import CityTapGame from './components/CityTapGame';
import Splash from './components/Splash';
import './App.css';

function App() {
  const [intro, setIntro] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const startPlay = useCallback(() => setIntro(false), []);
  const hideSplash = useCallback(() => setShowSplash(false), []);

  return (
    <>
      <CityTapGame intro={intro} />
      {showSplash && <Splash onPlay={startPlay} onGone={hideSplash} />}
    </>
  );
}

export default App;
