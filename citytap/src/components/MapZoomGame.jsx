import { useEffect, useState } from 'react';
import MysteryMap from './MysteryMap';
import GuessGlobe from './GuessGlobe';
import MapZoomReveal from './MapZoomReveal';
import ResultsScreen from './ResultsScreen';
import ModeToggle from './ModeToggle';
import HomeButton from './HomeButton';
import { formatDistance, getDayNumber } from '../utils/gameLogic';
import {
  ZOOM_STAGES,
  LAST_STAGE_INDEX,
  TOTAL_ROUNDS,
  getDailyLocations,
  getRandomLocations,
  scoreGuess,
  generateMapZoomShareText
} from '../utils/mapZoomLogic';

function MapZoomGame({ onBack }) {
  const [dayNumber] = useState(getDayNumber());
  const [gameMode, setGameMode] = useState('daily');
  const [locations, setLocations] = useState(() => getDailyLocations(dayNumber));
  const [currentRound, setCurrentRound] = useState(0);
  const [zoomStage, setZoomStage] = useState(0);
  const [gameState, setGameState] = useState('looking');
  const [rounds, setRounds] = useState([]);
  const [currentGuess, setCurrentGuess] = useState(null);
  const [pin, setPin] = useState(null);
  const [missDistance, setMissDistance] = useState(null);

  const location = locations[currentRound];
  const stage = ZOOM_STAGES[zoomStage];
  const finished = gameState === 'results' || gameState === 'review';
  const globeOpen = gameState === 'guessing' || gameState === 'miss' || gameState === 'reveal' || gameState === 'review';
  const runningScore = rounds.reduce((sum, round) => sum + round.score, 0);
  const scoreMax = finished ? TOTAL_ROUNDS * 100 : rounds.length * 100;

  const startNewGame = (nextLocations) => {
    setLocations(nextLocations);
    setCurrentRound(0);
    setZoomStage(0);
    setGameState('looking');
    setRounds([]);
    setCurrentGuess(null);
    setPin(null);
    setMissDistance(null);
  };

  const handleGameModeChange = (mode) => {
    if (mode === gameMode) return;
    setGameMode(mode);
    startNewGame(mode === 'random' ? getRandomLocations() : getDailyLocations(dayNumber));
  };

  const lockRound = (roundData) => {
    setCurrentGuess(roundData);
    setRounds((prev) => [...prev, roundData]);
    setGameState('reveal');
    setMissDistance(null);
  };

  const handleIdk = () => {
    if (gameState !== 'looking') return;
    if (zoomStage < LAST_STAGE_INDEX) {
      setZoomStage((prev) => prev + 1);
      return;
    }
    lockRound({
      guessedCity: { name: 'I don’t know', country: '' },
      correct: location,
      correctCity: location,
      distance: 0,
      score: 0,
      skipped: true,
      zoomStage,
      guessSummary: 'Passed'
    });
  };

  const handleOpenGuess = () => {
    if (gameState !== 'looking') return;
    setPin(null);
    setMissDistance(null);
    setGameState('guessing');
  };

  const handleCancelGuess = () => {
    if (gameState !== 'guessing') return;
    setPin(null);
    setGameState('looking');
  };

  const handleLockIn = () => {
    if (gameState !== 'guessing' || !pin || !location) return;
    const result = scoreGuess(pin, location, zoomStage);

    if (!result.hit) {
      setMissDistance(result.distance);
      setGameState('miss');
      return;
    }

    lockRound({
      guessedCity: { name: 'Dropped pin', country: formatDistance(result.distance) },
      guessed: pin,
      correct: location,
      correctCity: location,
      distance: result.distance,
      score: result.score,
      skipped: false,
      zoomStage,
      guessSummary: `${formatDistance(result.distance)} · ${stage.label}`
    });
  };

  useEffect(() => {
    if (gameState !== 'miss') return undefined;
    const timer = setTimeout(() => {
      setPin(null);
      setMissDistance(null);
      setZoomStage((prev) => Math.min(prev + 1, LAST_STAGE_INDEX));
      setGameState('looking');
    }, 1600);
    return () => clearTimeout(timer);
  }, [gameState]);

  const handleContinue = () => {
    if (currentRound < TOTAL_ROUNDS - 1) {
      setCurrentRound((prev) => prev + 1);
      setZoomStage(0);
      setCurrentGuess(null);
      setPin(null);
      setMissDistance(null);
      setGameState('looking');
      return;
    }
    setGameState('results');
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && gameState === 'guessing') {
        setPin(null);
        setGameState('looking');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState]);

  return (
    <div className="game-shell">
      <header className="game-header">
        <div className="game-header-inner">
          <div className="game-header-left">
            <HomeButton onClick={onBack} />
            <div>
              <h1 className="game-wordmark">MapZoom</h1>
              <div className="game-subtitle">
                {gameMode === 'daily' ? `#${dayNumber} · Daily` : 'Random · Testing'}
              </div>
            </div>
          </div>
          <div className="game-header-right">
            <div className="game-scoreboard">
              <div className="game-scoreboard-round">
                {finished ? 'Finished' : `${currentRound + 1} / ${TOTAL_ROUNDS}`}
              </div>
              <div className="game-scoreboard-score">
                {runningScore}
                <span>/{scoreMax}</span>
              </div>
            </div>
            <ModeToggle mode={gameMode} onChange={handleGameModeChange} />
          </div>
        </div>
      </header>

      {location && (
        <MysteryMap
          location={location}
          zoom={stage.zoom}
          inset={gameState === 'guessing' || gameState === 'miss'}
        />
      )}

      <GuessGlobe
        pin={currentGuess?.guessed ?? pin}
        onPinChange={setPin}
        interactive={gameState === 'guessing'}
        revealPair={
          gameState === 'reveal' || gameState === 'review'
            ? { guess: currentGuess?.guessed, correct: currentGuess?.correct }
            : null
        }
        visible={globeOpen}
      />

      {gameState === 'looking' && (
        <div className="search-dock mapzoom-dock">
          <div className="mapzoom-looks" aria-hidden="true">
            {ZOOM_STAGES.map((item, index) => (
              <span
                key={item.label}
                className={`mapzoom-look${index === zoomStage ? ' is-current' : ''}${index < zoomStage ? ' is-spent' : ''}`}
              />
            ))}
          </div>
          <div className="mapzoom-actions">
            <button type="button" className="mapzoom-idk" onClick={handleIdk}>
              I don’t know
            </button>
            <button type="button" className="mapzoom-guess" onClick={handleOpenGuess}>
              Guess
            </button>
          </div>
          <div className="search-hint">
            {stage.label} look · up to {stage.maxScore} pts
          </div>
        </div>
      )}

      {gameState === 'guessing' && (
        <div className="mapzoom-guess-dock">
          <button type="button" className="results-secondary mapzoom-back-map" onClick={handleCancelGuess}>
            Back to map
          </button>
          <button
            type="button"
            className="reveal-card-continue mapzoom-lock-in"
            onClick={handleLockIn}
            disabled={!pin}
          >
            {pin ? 'Lock in pin' : 'Tap the globe'}
          </button>
        </div>
      )}

      {gameState === 'miss' && missDistance != null && (
        <div className="mapzoom-miss" role="status">
          <strong>{formatDistance(missDistance)} off</strong>
          <span>Too far — zooming out</span>
        </div>
      )}

      {gameState === 'reveal' && currentGuess && (
        <MapZoomReveal
          round={currentGuess}
          roundNumber={currentRound + 1}
          totalRounds={TOTAL_ROUNDS}
          rounds={rounds}
          onContinue={handleContinue}
        />
      )}

      {gameState === 'results' && (
        <ResultsScreen
          rounds={rounds}
          dayNumber={dayNumber}
          gameMode={gameMode}
          shareBuilder={generateMapZoomShareText}
          onViewMap={() => setGameState('review')}
          onPlayAgain={() => startNewGame(getRandomLocations())}
        />
      )}

      {gameState === 'review' && (
        <button className="show-results-chip" onClick={() => setGameState('results')}>
          Show score
        </button>
      )}
    </div>
  );
}

export default MapZoomGame;
