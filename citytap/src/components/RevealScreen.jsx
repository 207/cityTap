import { formatDistance, getScoreEmoji, getScoreTone } from '../utils/gameLogic';
import { useCountUp } from '../utils/useCountUp';

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

function RevealScreen({ round, roundNumber, totalRounds, rounds, onContinue }) {
  const { guessedCity, correctCity, distance, score, sameCountry } = round;
  const shownScore = useCountUp(score, 850);
  const tone = getScoreTone(score);

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
          <span className="reveal-distance-value">{formatDistance(distance)}</span>
          <span className="reveal-distance-label">from the pin</span>
        </div>

        <div className="reveal-card-cities">
          <div className="reveal-city-block">
            <div className="reveal-card-label">You guessed</div>
            <div className="reveal-card-city reveal-card-city-guess">
              {guessedCity.name}
              <span>{guessedCity.country}</span>
            </div>
          </div>
          <div className="reveal-city-block">
            <div className="reveal-card-label">Nearest city</div>
            <div className="reveal-card-city reveal-card-city-correct">
              {correctCity.name}
              <span>{correctCity.country}</span>
            </div>
          </div>
        </div>

        <div className="reveal-card-meta">
          <span className="reveal-emoji">{getScoreEmoji(score)}</span>
          {sameCountry ? (
            <span className="reveal-card-bonus">Same country</span>
          ) : (
            <span>Different country</span>
          )}
        </div>

        <button className="reveal-card-continue" onClick={onContinue}>
          {roundNumber < totalRounds ? 'Next location' : 'See final score'}
        </button>
      </div>
    </div>
  );
}

export default RevealScreen;
