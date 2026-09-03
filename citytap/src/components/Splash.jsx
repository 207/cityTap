import { useEffect, useState } from 'react';
import { getDayNumber, parseSeedInput } from '../utils/gameLogic';
import { isDailyFinished, isDailyInProgress } from '../utils/dailyProgress';
import BrandMark from './BrandMark';
import DifficultyToggle from './DifficultyToggle';

const FADE_MS = 700;

function Splash({ onPlay, onPlaySeed, onGone, difficulty = 'easy', onDifficultyChange }) {
  const [dayNumber] = useState(getDayNumber);
  const [leaving, setLeaving] = useState(false);
  const [seedInput, setSeedInput] = useState('');
  const finished = isDailyFinished(dayNumber, difficulty);
  const inProgress = isDailyInProgress(dayNumber, difficulty);
  const otherDone = difficulty === 'easy'
    ? isDailyFinished(dayNumber, 'hard')
    : isDailyFinished(dayNumber, 'easy');

  const handlePlay = () => {
    if (leaving) return;
    setLeaving(true);
    onPlay();
  };

  useEffect(() => {
    if (!leaving) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(onGone, reduced ? 0 : FADE_MS);
    return () => clearTimeout(timer);
  }, [leaving, onGone]);

  return (
    <div className={`splash${leaving ? ' is-leaving' : ''}`}>
      <div className="splash-panel">
        <BrandMark size={72} className="splash-mark" />
        <p className="splash-kicker">Daily #{dayNumber}</p>
        <h1 className="splash-wordmark">CitySnipe</h1>
        <p className="splash-copy">
          {finished
            ? (otherDone ? 'You already played today' : `${difficulty === 'hard' ? 'Hard' : 'Easy'} complete`)
            : 'Name the nearest city'}
        </p>
        {onDifficultyChange && (
          <DifficultyToggle difficulty={difficulty} onChange={onDifficultyChange} />
        )}
        <button type="button" className="splash-play" onClick={handlePlay}>
          {finished ? 'See score' : inProgress ? 'Continue' : `Play ${difficulty === 'hard' ? 'Hard' : 'Easy'}`}
        </button>
        {onPlaySeed && (
          <form
            className="splash-seed"
            onSubmit={(event) => {
              event.preventDefault();
              const parsed = parseSeedInput(seedInput);
              if (!parsed || leaving) return;
              setLeaving(true);
              onPlaySeed(parsed);
            }}
          >
            <input
              className="splash-seed-input"
              value={seedInput}
              onChange={(event) => setSeedInput(event.target.value)}
              placeholder="Or enter a seed"
              aria-label="Game seed"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck="false"
            />
            <button type="submit" className="splash-seed-play" disabled={!parseSeedInput(seedInput)}>
              Play seed
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Splash;
