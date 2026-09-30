import { useCallback, useState, useEffect } from 'react';
import CityTapGame from './components/CityTapGame';
import Splash from './components/Splash';
import { readSeedFromUrl, updatePlayableCities } from './utils/gameLogic';
import { readDifficulty, readHardZoom, writeDifficulty, writeHardZoom } from './utils/difficulty';
import { readExcludeRussia, writeExcludeRussia } from './utils/settings';
import './App.css';

function App() {
  const [urlSeed] = useState(readSeedFromUrl);
  const skipSplash = Boolean(urlSeed);
  const [intro, setIntro] = useState(!skipSplash);
  const [showSplash, setShowSplash] = useState(!skipSplash);
  const [splashSeed, setSplashSeed] = useState('');
  const [difficulty, setDifficulty] = useState(readDifficulty);
  const [hardZoom, setHardZoom] = useState(readHardZoom);
  const [excludeRussia, setExcludeRussia] = useState(readExcludeRussia);
  
  useEffect(() => {
    updatePlayableCities(excludeRussia);
  }, [excludeRussia]);
  
  const startPlay = useCallback(() => setIntro(false), []);
  const hideSplash = useCallback(() => setShowSplash(false), []);
  const playSeed = useCallback((seed) => {
    setSplashSeed(seed);
    setIntro(false);
  }, []);
  const handleDifficulty = useCallback((next) => {
    writeDifficulty(next);
    setDifficulty(next);
  }, []);
  const handleHardZoom = useCallback((next) => {
    setHardZoom(writeHardZoom(next));
  }, []);
  const handleExcludeRussia = useCallback((next) => {
    writeExcludeRussia(next);
    setExcludeRussia(next);
  }, []);

  return (
    <>
      <CityTapGame
        intro={intro}
        initialSeed={urlSeed}
        splashSeed={splashSeed}
        difficulty={difficulty}
        hardZoom={hardZoom}
        excludeRussia={excludeRussia}
        onDifficultyChange={handleDifficulty}
        onHardZoomChange={handleHardZoom}
        onExcludeRussiaChange={handleExcludeRussia}
      />
      {showSplash && (
        <Splash
          difficulty={difficulty}
          onDifficultyChange={handleDifficulty}
          onPlay={startPlay}
          onPlaySeed={playSeed}
          onGone={hideSplash}
        />
      )}
    </>
  );
}

export default App;
