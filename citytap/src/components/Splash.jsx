import { useEffect, useState } from 'react';
import { getDayNumber } from '../utils/gameLogic';
import { isDailyFinished, loadDailyProgress } from '../utils/dailyProgress';

const FADE_MS = 700;

function Splash({ onPlay, onGone }) {
  const [dayNumber] = useState(getDayNumber);
  const [leaving, setLeaving] = useState(false);
  const finished = isDailyFinished(dayNumber);
  const inProgress = !finished && (loadDailyProgress(dayNumber)?.rounds?.length ?? 0) > 0;

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
        <p className="splash-kicker">Daily #{dayNumber}</p>
        <h1 className="splash-wordmark">CityTap</h1>
        <p className="splash-copy">
          {finished ? 'You already played today' : 'Name the nearest city'}
        </p>
        <button type="button" className="splash-play" onClick={handlePlay}>
          {finished ? 'See score' : inProgress ? 'Continue' : 'Play'}
        </button>
      </div>
    </div>
  );
}

export default Splash;
