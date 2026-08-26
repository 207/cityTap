import { formatDistance, getScoreEmoji, getScoreTone } from '../utils/gameLogic';
import { useCountUp } from '../utils/useCountUp';
import { ZOOM_STAGES } from '../utils/mapZoomLogic';

function RoundPips({ rounds, currentRound, totalRounds }) {
  return (
    <div className="round-pips" aria-hidden="true">
      {Array.from({ length: totalRounds }, (_, i) => {
        const round = rounds[i];
        const tone = round ? getScoreTone(round.score) : i === currentRound ? 'current' : 'empty';
        return <span key={i} className={`round-pip round-pip-${tone}`} />;
      })}
    </div>
  );
}

function MapZoomReveal({ round, roundNumber, totalRounds, rounds, onContinue }) {
  const shownScore = useCountUp(round.score, 850);
  const tone = getScoreTone(round.score);
  const stage = ZOOM_STAGES[round.zoomStage] ?? ZOOM_STAGES[0];

  return (
    <div className="reveal-panel" role="dialog" aria-label={`Round ${roundNumber} result`}>
      <div className="reveal-card">
        <div className="reveal-card-top">
          <RoundPips rounds={rounds} currentRound={roundNumber - 1} totalRounds={totalRounds} />
          <div className={`reveal-card-score score-${tone}`}>
            <span className="reveal-card-score-num">{shownScore}</span>
            <span className="reveal-card-score-den">/100</span>
          </div>
        </div>

        <div className="reveal-distance">
          <span className="reveal-distance-value">
            {round.skipped ? 'No pin' : formatDistance(round.distance)}
          </span>
          <span className="reveal-distance-label">
            {round.skipped ? 'Passed on the last look' : 'from the place'}
          </span>
        </div>

        <div className="reveal-card-cities">
          <div className="reveal-city-block">
            <div className="reveal-card-label">You guessed</div>
            <div className="reveal-card-city reveal-card-city-guess">
              {round.skipped ? 'I don’t know' : 'Dropped pin'}
              <span>{round.skipped ? '0 pts' : `${stage.label} look · ${stage.maxScore} max`}</span>
            </div>
          </div>
          <div className="reveal-city-block">
            <div className="reveal-card-label">The place</div>
            <div className="reveal-card-city reveal-card-city-correct">
              {round.correct.name}
              <span>{round.correct.country}</span>
            </div>
          </div>
        </div>

        <div className="reveal-card-meta">
          <span className="reveal-emoji">{getScoreEmoji(round.score)}</span>
          <span>Look {round.zoomStage + 1} of {ZOOM_STAGES.length}</span>
        </div>

        <button className="reveal-card-continue" onClick={onContinue}>
          {roundNumber < totalRounds ? 'Next location' : 'See final score'}
        </button>
      </div>
    </div>
  );
}

export default MapZoomReveal;
