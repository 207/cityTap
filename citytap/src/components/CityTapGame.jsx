import { useEffect, useRef, useState } from 'react';
import Globe from './Globe';
import SearchBox from './SearchBox';
import RevealScreen from './RevealScreen';
import ResultsScreen from './ResultsScreen';
import ThemeToggle from './ThemeToggle';
import ModeToggle from './ModeToggle';
import DifficultyToggle from './DifficultyToggle';
import BrandMark from './BrandMark';
import {
  getDailyCities,
  getSeededCities,
  generateGameSeed,
  normalizeSeed,
  writeSeedToUrl,
  getDayNumber,
  calculateDistance,
  calculateFinalScore,
  loadGuessableCities
} from '../utils/gameLogic';
import { loadDailyProgress, saveDailyProgress, isDailyFinished } from '../utils/dailyProgress';

const TOTAL_ROUNDS = 5;

function pinIndex(gameState, roundsLength) {
  if (gameState === 'playing') return roundsLength;
  return Math.min(Math.max(roundsLength - 1, 0), TOTAL_ROUNDS - 1);
}

function emptyDaily(dayNumber, difficulty = 'easy') {
  return {
    gameCities: getDailyCities(dayNumber, difficulty),
    gameState: 'playing',
    rounds: [],
    currentGuess: null,
    guessedCities: [],
    correctCities: []
  };
}

function restoredDaily(dayNumber, difficulty = 'easy') {
  const saved = loadDailyProgress(dayNumber, difficulty);
  if (!saved) return emptyDaily(dayNumber, difficulty);
  const rounds = saved.rounds ?? [];
  let gameState = saved.gameState ?? 'playing';
  let currentGuess = saved.currentGuess ?? null;

  if (gameState === 'reveal') {
    currentGuess = currentGuess ?? rounds[rounds.length - 1] ?? null;
    if (!currentGuess) gameState = 'playing';
  } else if (gameState === 'playing') {
    currentGuess = null;
  }

  if (gameState === 'playing' && rounds.length >= TOTAL_ROUNDS) {
    gameState = 'results';
  }

  return {
    gameCities: getDailyCities(dayNumber, difficulty),
    gameState,
    rounds,
    currentGuess,
    guessedCities: saved.guessedCities ?? [],
    correctCities: saved.correctCities ?? []
  };
}

function emptyRandom(seed) {
  const normalized = normalizeSeed(seed) || generateGameSeed();
  return {
    seed: normalized,
    gameCities: getSeededCities(normalized, TOTAL_ROUNDS),
    gameState: 'playing',
    rounds: [],
    currentGuess: null,
    guessedCities: [],
    correctCities: []
  };
}

function CityTapGame({ intro = false, initialSeed = '', splashSeed = '', difficulty = 'easy', hardZoom = 5.8, onDifficultyChange, onHardZoomChange }) {
  const [dayNumber] = useState(getDayNumber);
  const [boot] = useState(() => {
    const seeded = normalizeSeed(initialSeed);
    return seeded ? emptyRandom(seeded) : restoredDaily(getDayNumber(), difficulty);
  });
  const [gameMode, setGameMode] = useState(normalizeSeed(initialSeed) ? 'random' : 'daily');
  const [gameSeed, setGameSeed] = useState(boot.seed ?? '');
  const [seedCopied, setSeedCopied] = useState(false);
  const [hardInterlude, setHardInterlude] = useState(false);
  const [interludeLeaving, setInterludeLeaving] = useState(false);
  const [gameCities, setGameCities] = useState(boot.gameCities);
  const [gameState, setGameState] = useState(boot.gameState);
  const [rounds, setRounds] = useState(boot.rounds);
  const [currentGuess, setCurrentGuess] = useState(boot.currentGuess);
  const [guessedCities, setGuessedCities] = useState(boot.guessedCities);
  const [correctCities, setCorrectCities] = useState(boot.correctCities);
  const guessLock = useRef(false);
  const dailyDiffRef = useRef(difficulty);
  const interludeTimers = useRef([]);

  const currentRound = pinIndex(gameState, rounds.length);
  const currentCity = gameState === 'playing' ? gameCities[rounds.length] ?? null : null;

  useEffect(() => {
    loadGuessableCities();
  }, []);

  useEffect(() => {
    const seed = normalizeSeed(splashSeed);
    if (!seed) return;
    startRandomGame(seed);
  }, [splashSeed]);

  useEffect(() => {
    if (gameMode !== 'daily') {
      dailyDiffRef.current = difficulty;
      return;
    }
    if (dailyDiffRef.current === difficulty) return;
    dailyDiffRef.current = difficulty;
    guessLock.current = false;
    setHardInterlude(false);
    setInterludeLeaving(false);
    applyState(restoredDaily(dayNumber, difficulty));
  }, [difficulty, gameMode, dayNumber]);

  useEffect(() => {
    if (gameState === 'playing' && rounds.length >= TOTAL_ROUNDS) {
      setGameState('results');
    }
  }, [gameState, rounds.length]);

  const persistDaily = (next) => {
    const merged = {
      dayNumber,
      gameState,
      rounds,
      currentGuess,
      guessedCities,
      correctCities,
      ...next
    };
    saveDailyProgress({
      ...merged,
      currentRound: pinIndex(merged.gameState, (merged.rounds ?? []).length)
    }, difficulty);
  };

  const applyState = (next) => {
    setGameCities(next.gameCities);
    setGameState(next.gameState);
    setRounds(next.rounds);
    setCurrentGuess(next.currentGuess);
    setGuessedCities(next.guessedCities);
    setCorrectCities(next.correctCities);
  };

  const handleGuess = (guessedCity) => {
    if (gameState !== 'playing' || !currentCity || guessLock.current) return;
    guessLock.current = true;

    const correctCity = currentCity;
    const distance = calculateDistance(
      guessedCity.lat,
      guessedCity.lng,
      correctCity.lat,
      correctCity.lng
    );

    const score = calculateFinalScore(distance);
    const sameCountry = guessedCity.country === correctCity.country;

    const roundData = {
      guessedCity,
      correctCity,
      distance,
      score,
      sameCountry
    };

    const nextRounds = [...rounds, roundData];
    const nextGuessed = [...guessedCities, guessedCity];
    const nextCorrect = [...correctCities, correctCity];

    setCurrentGuess(roundData);
    setRounds(nextRounds);
    setGuessedCities(nextGuessed);
    setCorrectCities(nextCorrect);
    setGameState('reveal');

    if (gameMode === 'daily') {
      persistDaily({
        currentGuess: roundData,
        rounds: nextRounds,
        guessedCities: nextGuessed,
        correctCities: nextCorrect,
        gameState: 'reveal'
      });
    }
  };

  const clearInterludeTimers = () => {
    interludeTimers.current.forEach(clearTimeout);
    interludeTimers.current = [];
  };

  const handleContinue = () => {
    guessLock.current = false;
    if (rounds.length < TOTAL_ROUNDS) {
      const advance = () => {
        setGameState('playing');
        setCurrentGuess(null);
        if (gameMode === 'daily') {
          persistDaily({
            gameState: 'playing',
            currentGuess: null
          });
        }
      };

      if (difficulty === 'hard') {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        clearInterludeTimers();
        setInterludeLeaving(false);
        setHardInterlude(true);
        setCurrentGuess(null);
        const jumpAt = reduced ? 0 : 240;
        const revealAt = reduced ? 0 : 780;
        const hideAt = reduced ? 0 : 1080;
        interludeTimers.current.push(setTimeout(advance, jumpAt));
        interludeTimers.current.push(setTimeout(() => setInterludeLeaving(true), revealAt));
        interludeTimers.current.push(setTimeout(() => {
          setHardInterlude(false);
          setInterludeLeaving(false);
        }, hideAt));
        return;
      }

      advance();
      return;
    }

    setGameState('results');
    if (gameMode === 'daily') {
      persistDaily({
        gameState: 'results',
        currentGuess: null
      });
    }
  };

  const handleViewMap = () => {
    setGameState('review');
    if (gameMode === 'daily') persistDaily({ gameState: 'review' });
  };

  const startRandomGame = (seedArg) => {
    const next = emptyRandom(seedArg);
    guessLock.current = false;
    setGameMode('random');
    setGameSeed(next.seed);
    writeSeedToUrl(next.seed);
    applyState(next);
  };

  useEffect(() => {
    if (gameMode === 'random' && gameSeed) writeSeedToUrl(gameSeed);
  }, [gameMode, gameSeed]);

  const handlePlayAgain = () => {
    if (gameMode !== 'random') return;
    startRandomGame();
  };

  const handleGameModeChange = (mode) => {
    if (mode === gameMode) return;
    if (mode === 'random') {
      startRandomGame();
      return;
    }
    guessLock.current = false;
    setGameMode(mode);
    setGameSeed('');
    writeSeedToUrl('');
    applyState(restoredDaily(dayNumber, difficulty));
  };

  useEffect(() => () => clearInterludeTimers(), []);

  const handleTryHard = () => {
    if (onDifficultyChange) onDifficultyChange('hard');
  };

  const handleCopySeed = async () => {
    if (!gameSeed) return;
    try {
      await navigator.clipboard.writeText(gameSeed);
      setSeedCopied(true);
      setTimeout(() => setSeedCopied(false), 1600);
    } catch (err) {
      console.error('Failed to copy seed:', err);
    }
  };

  const runningScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const finished = gameState === 'results' || gameState === 'review';
  const hard = difficulty === 'hard';
  const showHistory = !hard || finished;
  const visibleGuesses = showHistory
    ? guessedCities
    : (gameState === 'reveal' && currentGuess ? [currentGuess.guessedCity] : []);
  const visibleCorrect = showHistory
    ? correctCities
    : (gameState === 'reveal' && currentGuess ? [currentGuess.correctCity] : []);
  const hardDailyDone = isDailyFinished(dayNumber, 'hard');
  const showTryHard = gameMode === 'daily' && difficulty === 'easy' && finished && !hardDailyDone;
  const scoreMax = finished ? TOTAL_ROUNDS * 100 : rounds.length * 100;
  const modeLabel = [
    gameMode === 'daily' ? `#${dayNumber} · Daily` : `Random · ${gameSeed}`,
    hard ? 'Hard' : null
  ].filter(Boolean).join(' · ');

  return (
    <div className="game-shell">
      {!intro && (
        <header className="game-header">
          <div className="game-header-inner">
            <div className="game-brand">
              <BrandMark size={32} />
              <div>
                <h1 className="game-wordmark">CitySnipe</h1>
                <div className="game-subtitle">
                  {gameMode === 'daily' ? (
                    modeLabel
                  ) : (
                    <button type="button" className="game-seed-btn" onClick={handleCopySeed}>
                      {modeLabel}{seedCopied ? ' · Copied' : ''}
                    </button>
                  )}
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
              <DifficultyToggle
                difficulty={difficulty}
                onChange={onDifficultyChange}
                hardZoom={hardZoom}
                onHardZoomChange={onHardZoomChange}
              />
              <ModeToggle mode={gameMode} onChange={handleGameModeChange} />
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      <Globe
        intro={intro}
        hard={hard}
        hardZoom={hardZoom}
        recap={finished}
        cover={hardInterlude && !interludeLeaving}
        rounds={rounds}
        currentCity={currentCity}
        guessedCities={visibleGuesses}
        correctCities={visibleCorrect}
        revealPair={gameState === 'reveal' ? currentGuess : null}
        focusKey={`${gameState}-${currentRound}-${currentCity?.lat ?? 'x'}-${currentCity?.lng ?? 'x'}-${hard ? 'h' : 'e'}`}
      />

      {gameState === 'playing' && !intro && !hardInterlude && (
        <div className="search-dock">
          <div className="search-hint">Name the nearest city</div>
          <SearchBox key={currentRound} onSubmit={handleGuess} disabled={false} />
        </div>
      )}

      {gameState === 'reveal' && currentGuess && !intro && (
        <RevealScreen
          round={currentGuess}
          roundNumber={currentRound + 1}
          totalRounds={TOTAL_ROUNDS}
          rounds={rounds}
          onContinue={handleContinue}
        />
      )}

      {gameState === 'results' && !intro && (
        <ResultsScreen
          rounds={rounds}
          dayNumber={dayNumber}
          gameMode={gameMode}
          difficulty={difficulty}
          seed={gameSeed}
          onViewMap={handleViewMap}
          onPlayAgain={handlePlayAgain}
          onPlayRandom={() => startRandomGame()}
          onPlaySeed={startRandomGame}
          onTryHard={showTryHard ? handleTryHard : undefined}
        />
      )}

      {hardInterlude && (
        <div className={`round-load${interludeLeaving ? ' is-leaving' : ''}`}>
          <div className="round-load-card">
            <BrandMark size={44} />
            <p>Next location</p>
          </div>
        </div>
      )}

      {gameState === 'review' && !intro && (
        <button className="show-results-chip" onClick={() => {
          setGameState('results');
          if (gameMode === 'daily') persistDaily({ gameState: 'results' });
        }}>
          Show score
        </button>
      )}
    </div>
  );
}

export default CityTapGame;
