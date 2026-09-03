import { useEffect, useState } from 'react';
import { getDayNumber, parseSeedInput } from '../utils/gameLogic';
import { isDailyFinished, isDailyInProgress } from '../utils/dailyProgress';
import { DIFFICULTIES, difficultyLabel } from '../utils/difficulty';
import BrandMark from './BrandMark';
import DifficultyToggle from './DifficultyToggle';

const FADE_MS = 700;

function Splash({ onPlay, onPlaySeed, onGone, difficulty = 'easy', onDifficultyChange }) {
  const [dayNumber] = useState(getDayNumber);
  const [leaving, setLeaving] = useState(false);
  const [seedInput, setSeedInput] = useState('');
  const finished = isDailyFinished(dayNumber, difficulty);
  const inProgress = isDailyInProgress(dayNumber, difficulty);
  const allDone = DIFFICULTIES.every((mode) => isDailyFinished(dayNumber, mode));
  const label = difficultyLabel(difficulty);

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
        <h1 className="splash-wordmark">
          CitySn<span className="splash-tittle splash-tittle-dot"><span className="splash-tittle-letter">i</span><svg className="splash-tittle-mark" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7.2" fill="#ef4444"/><circle cx="8" cy="8" r="4.8" fill="#f8fafc"/><circle cx="8" cy="8" r="2.7" fill="#ef4444"/><circle cx="8" cy="8" r="1.15" fill="#b91c1c"/></svg></span>pe
        </h1>
        <p className="splash-copy">
          {finished
            ? (allDone ? 'You already played today' : `${label} complete`)
            : 'Name the nearest city'}
        </p>
        {onDifficultyChange && (
          <DifficultyToggle difficulty={difficulty} onChange={onDifficultyChange} />
        )}
        <button type="button" className="splash-play" onClick={handlePlay}>
          {finished ? 'See score' : inProgress ? 'Continue' : `Play ${label}`}
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
