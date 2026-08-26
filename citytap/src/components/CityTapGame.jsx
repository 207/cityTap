import { useState } from 'react';
import Globe from './Globe';
import SearchBox from './SearchBox';
import RevealScreen from './RevealScreen';
import ResultsScreen from './ResultsScreen';
import ThemeToggle from './ThemeToggle';
import ModeToggle from './ModeToggle';
import HomeButton from './HomeButton';
import {
  getDailyCities,
  getRandomCities,
  getDayNumber,
  calculateDistance,
  calculateFinalScore
} from '../utils/gameLogic';

function CityTapGame({ onBack }) {
  const [dayNumber] = useState(getDayNumber());
  const [gameMode, setGameMode] = useState('daily');
  const [gameCities, setGameCities] = useState(() => getDailyCities(dayNumber));
  const [currentRound, setCurrentRound] = useState(0);
  const [gameState, setGameState] = useState('playing');
  const [rounds, setRounds] = useState([]);
  const [currentGuess, setCurrentGuess] = useState(null);
  const [guessedCities, setGuessedCities] = useState([]);
  const [correctCities, setCorrectCities] = useState([]);

  const currentCity = gameCities[currentRound];
  const totalRounds = 5;

  const handleGuess = (guessedCity) => {
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

    setCurrentGuess(roundData);
    setRounds([...rounds, roundData]);
    setGuessedCities([...guessedCities, guessedCity]);
    setCorrectCities([...correctCities, correctCity]);
    setGameState('reveal');
  };

  const handleContinue = () => {
    if (currentRound < totalRounds - 1) {
      setCurrentRound(currentRound + 1);
      setGameState('playing');
      setCurrentGuess(null);
    } else {
      setGameState('results');
    }
  };

  const handleViewMap = () => {
    setGameState('review');
  };

  const handlePlayAgain = () => {
    startNewGame(gameMode === 'random' ? getRandomCities(5) : getDailyCities(dayNumber));
  };

  const startNewGame = (cities) => {
    setGameCities(cities);
    setCurrentRound(0);
    setGameState('playing');
    setRounds([]);
    setCurrentGuess(null);
    setGuessedCities([]);
    setCorrectCities([]);
  };

  const handleGameModeChange = (mode) => {
    if (mode === gameMode) return;
    setGameMode(mode);
    startNewGame(mode === 'random' ? getRandomCities(5) : getDailyCities(dayNumber));
  };

  const runningScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const finished = gameState === 'results' || gameState === 'review';
  const scoreMax = finished ? totalRounds * 100 : rounds.length * 100;

  return (
    <div className="game-shell">
      <header className="game-header">
        <div className="game-header-inner">
          <div className="game-header-left">
            <HomeButton onClick={onBack} />
            <div>
              <h1 className="game-wordmark">CityTap</h1>
              <div className="game-subtitle">
                {gameMode === 'daily' ? `#${dayNumber} · Daily` : 'Random · Testing'}
              </div>
            </div>
          </div>
          <div className="game-header-right">
            <div className="game-scoreboard">
              <div className="game-scoreboard-round">
                {finished ? 'Finished' : `${currentRound + 1} / ${totalRounds}`}
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

      <Globe
        currentCity={currentCity}
        guessedCities={guessedCities}
        correctCities={correctCities}
        revealPair={gameState === 'reveal' ? currentGuess : null}
      />

      {gameState === 'playing' && (
        <div className="search-dock">
          <SearchBox onSubmit={handleGuess} disabled={false} />
          <div className="search-hint">Name the nearest city</div>
        </div>
      )}

      {gameState === 'reveal' && currentGuess && (
        <RevealScreen
          round={currentGuess}
          roundNumber={currentRound + 1}
          totalRounds={totalRounds}
          rounds={rounds}
          onContinue={handleContinue}
        />
      )}

      {gameState === 'results' && (
        <ResultsScreen
          rounds={rounds}
          dayNumber={dayNumber}
          gameMode={gameMode}
          onViewMap={handleViewMap}
          onPlayAgain={handlePlayAgain}
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

export default CityTapGame;
