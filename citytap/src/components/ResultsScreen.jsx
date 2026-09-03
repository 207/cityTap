import { useState } from 'react';
import { formatDistance, generateShareText, getScoreEmoji, getScoreTone, parseSeedInput } from '../utils/gameLogic';
import { useCountUp } from '../utils/useCountUp';

function ResultsScreen({
  rounds,
  dayNumber,
  gameMode,
  difficulty = 'easy',
  seed,
  onViewMap,
  onPlayAgain,
  onPlayRandom,
  onPlaySeed,
  onTryHard,
  shareBuilder = generateShareText
}) {
  const [copied, setCopied] = useState(false);
  const [seedCopied, setSeedCopied] = useState(false);
  const [seedInput, setSeedInput] = useState('');
  const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const shownScore = useCountUp(totalScore, 1100);
  const totalTone = getScoreTone(Math.round(totalScore / Math.max(rounds.length, 1)));

  const handleShare = async () => {
    const shareText = shareBuilder(rounds, dayNumber, { gameMode, seed, difficulty });
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopySeed = async () => {
    if (!seed) return;
    try {
      await navigator.clipboard.writeText(seed);
      setSeedCopied(true);
      setTimeout(() => setSeedCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy seed:', err);
    }
  };

  const handlePlaySeed = (event) => {
    event.preventDefault();
    const parsed = parseSeedInput(seedInput);
    if (!parsed || !onPlaySeed) return;
    onPlaySeed(parsed);
  };

  return (
    <div className="results-overlay">
      <div className="results-card">
        <div className="results-kicker">
          {gameMode === 'daily' ? `Daily #${dayNumber}` : `Random · ${seed}`}
          {difficulty === 'hard' ? ' · Hard' : ''}
        </div>
        <h1 className="results-title">
          {gameMode === 'daily' ? "Today's score" : 'Round complete'}
        </h1>

        <div className={`results-total score-${totalTone}`}>
          <span className="results-total-num">{shownScore}</span>
          <span className="results-total-den">/500</span>
        </div>

        <div className="results-emojis" aria-hidden="true">
          {rounds.map((round, i) => (
            <span key={i}>{getScoreEmoji(round.score)}</span>
          ))}
        </div>

        {gameMode === 'daily' && (
          <p className="results-tomorrow">
            {onTryHard
              ? 'Hard is a different set of cities today'
              : 'Come back tomorrow for a new daily'}
          </p>
        )}

        {gameMode === 'random' && seed && (
          <div className="results-seed">
            <span className="results-seed-label">Seed</span>
            <code className="results-seed-code">{seed}</code>
            <button type="button" className="results-seed-copy" onClick={handleCopySeed}>
              {seedCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}

        <div className="results-rounds">
          {rounds.map((round, i) => {
            const tone = getScoreTone(round.score);
            return (
              <div key={i} className="results-round">
                <div className="results-round-copy">
                  <div className="results-round-name">{round.correctCity.name}</div>
                  <div className="results-round-guess">
                    {round.guessSummary ?? `${round.guessedCity.name} · ${formatDistance(round.distance)}`}
                  </div>
                </div>
                <div className="results-round-meter">
                  <div
                    className={`results-round-fill score-fill-${tone}`}
                    style={{ width: `${round.score}%` }}
                  />
                </div>
                <div className={`results-round-score score-${tone}`}>{round.score}</div>
              </div>
            );
          })}
        </div>

        {onPlaySeed && (
          <form className="results-seed-form" onSubmit={handlePlaySeed}>
            <input
              className="results-seed-input"
              value={seedInput}
              onChange={(event) => setSeedInput(event.target.value)}
              placeholder="Enter a seed"
              aria-label="Game seed"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck="false"
            />
            <button type="submit" className="results-seed-play" disabled={!parseSeedInput(seedInput)}>
              Play seed
            </button>
          </form>
        )}

        <div className="results-actions">
          {onTryHard && (
            <button className="results-play" onClick={onTryHard}>
              Give Hard a try
            </button>
          )}
          {gameMode === 'daily' && onPlayRandom && (
            <button className={onTryHard ? 'results-secondary' : 'results-play'} onClick={onPlayRandom}>
              Play random
            </button>
          )}
          <button className={gameMode === 'daily' && onPlayRandom ? 'results-secondary' : 'results-share'} onClick={handleShare}>
            {copied ? 'Copied!' : 'Share score'}
          </button>
          <button className="results-secondary" onClick={onViewMap}>
            View globe
          </button>
          {gameMode === 'random' && (
            <button className="results-secondary" onClick={onPlayAgain}>
              New seed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsScreen;
