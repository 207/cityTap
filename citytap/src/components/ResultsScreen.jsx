import { useState } from 'react';
import { formatDistance, generateShareText, getScoreEmoji, getScoreTone } from '../utils/gameLogic';
import { useCountUp } from '../utils/useCountUp';

function ResultsScreen({
  rounds,
  dayNumber,
  gameMode,
  onViewMap,
  onPlayAgain,
  shareBuilder = generateShareText
}) {
  const [copied, setCopied] = useState(false);
  const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
  const shownScore = useCountUp(totalScore, 1100);
  const totalTone = getScoreTone(Math.round(totalScore / Math.max(rounds.length, 1)));

  const handleShare = async () => {
    const shareText = shareBuilder(rounds, dayNumber);
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="results-overlay">
      <div className="results-card">
        <div className="results-kicker">
          {gameMode === 'daily' ? `Daily #${dayNumber}` : 'Random game'}
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
          <p className="results-tomorrow">Come back tomorrow for a new daily</p>
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

        <div className="results-actions">
          <button className="results-share" onClick={handleShare}>
            {copied ? 'Copied!' : 'Share score'}
          </button>
          <button className="results-secondary" onClick={onViewMap}>
            View globe
          </button>
          {gameMode === 'random' && (
            <button className="results-secondary" onClick={onPlayAgain}>
              Play again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultsScreen;
