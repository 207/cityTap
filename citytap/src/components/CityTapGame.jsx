import { useEffect, useRef, useState } from 'react';
import Globe from './Globe';
import SearchBox from './SearchBox';
import RevealScreen from './RevealScreen';
import ResultsScreen from './ResultsScreen';
import ThemeToggle from './ThemeToggle';
import ModeToggle from './ModeToggle';
import {
  getDailyCities,
  getRandomCities,
  getDayNumber,
  calculateDistance,
  calculateFinalScore,
  loadGuessableCities
} from '../utils/gameLogic';
import { loadDailyProgress, saveDailyProgress } from '../utils/dailyProgress';

const TOTAL_ROUNDS = 5;

function pinIndex(gameState, roundsLength) {
  if (gameState === 'playing') return roundsLength;
  return Math.min(Math.max(roundsLength - 1, 0), TOTAL_ROUNDS - 1);
}

function emptyDaily(dayNumber) {
  return {
    gameCities: getDailyCities(dayNumber),
    gameState: 'playing',
    rounds: [],
    currentGuess: null,
    guessedCities: [],
    correctCities: []
  };
}

function restoredDaily(dayNumber) {
  const saved = loadDailyProgress(dayNumber);
  if (!saved) return emptyDaily(dayNumber);
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
    gameCities: getDailyCities(dayNumber),
    gameState,
    rounds,
    currentGuess,
    guessedCities: saved.guessedCities ?? [],
    correctCities: saved.correctCities ?? []
  };
}

function CityTapGame({ intro = false }) {
  const [dayNumber] = useState(getDayNumber);
  const [boot] = useState(() => restoredDaily(getDayNumber()));
  const [gameMode, setGameMode] = useState('daily');
  const [gameCities, setGameCities] = useState(boot.gameCities);
  const [gameState, setGameState] = useState(boot.gameState);
  const [rounds, setRounds] = useState(boot.rounds);
  const [currentGuess, setCurrentGuess] = useState(boot.currentGuess);
  const [guessedCities, setGuessedCities] = useState(boot.guessedCities);
  const [correctCities, setCorrectCities] = useState(boot.correctCities);
  const guessLock = useRef(false);

  const currentRound = pinIndex(gameState, rounds.length);
  const currentCity = gameState === 'playing' ? gameCities[rounds.length] ?? null : null;

  useEffect(() => {
    loadGuessableCities();
  }, []);

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
    });
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

  const handleContinue = () => {
    guessLock.current = false;
    if (rounds.length < TOTAL_ROUNDS) {
      setGameState('playing');
      setCurrentGuess(null);
      if (gameMode === 'daily') {
        persistDaily({
          gameState: 'playing',
          currentGuess: null
        });
      }
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

  const handlePlayAgain = () => {
    if (gameMode !== 'random') return;
    guessLock.current = false;
    applyState({
      gameCities: getRandomCities(5),
      gameState: 'playing',
      rounds: [],
      currentGuess: null,
      guessedCities: [],
      correctCities: []
    });
  };

  const handleGameModeChange = (mode) => {
    if (mode === gameMode) return;
    setGameMode(mode);
    guessLock.current = false;
    if (mode === 'random') {
      applyState({
        gameCities: getRandomCities(5),
        gameState: 'playing',
        rounds: [],
        currentGuess: null,
        guessedCities: [],
        correctCities: []
      });
      return;
    }
    applyState(restoredDaily(dayNumber));
  };

  const runningScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const finished = gameState === 'results' || gameState === 'review';
  const scoreMax = finished ? TOTAL_ROUNDS * 100 : rounds.length * 100;

  return (
    <div className="game-shell">
      {!intro && (
        <header className="game-header">
          <div className="game-header-inner">
            <div>
              <h1 className="game-wordmark">CityTap</h1>
              <div className="game-subtitle">
                {gameMode === 'daily' ? `#${dayNumber} · Daily` : 'Random · Testing'}
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
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      <Globe
        intro={intro}
        currentCity={currentCity}
        guessedCities={guessedCities}
        correctCities={correctCities}
        revealPair={gameState === 'reveal' ? currentGuess : null}
        focusKey={`${gameState}-${currentRound}-${currentCity?.lat ?? 'x'}-${currentCity?.lng ?? 'x'}`}
      />

      {gameState === 'playing' && !intro && (
        <div className="search-dock">
          <SearchBox key={currentRound} onSubmit={handleGuess} disabled={false} />
          <div className="search-hint">Name the nearest city</div>
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
          onViewMap={handleViewMap}
          onPlayAgain={handlePlayAgain}
        />
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
