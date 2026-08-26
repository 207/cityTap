import ThemeToggle from './ThemeToggle';
import { getDayNumber } from '../utils/gameLogic';

function MainMenu({ onPick }) {
  const dayNumber = getDayNumber();

  return (
    <div className="menu-shell">
      <header className="game-header">
        <div className="game-header-inner">
          <div>
            <h1 className="game-wordmark">CityTap</h1>
            <div className="game-subtitle">Daily #{dayNumber}</div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="menu-main">
        <p className="menu-kicker">Pick a game</p>
        <h2 className="menu-title">Five rounds. New places every day.</h2>

        <div className="menu-grid">
          <button type="button" className="menu-card" onClick={() => onPick('citytap')}>
            <span className="menu-card-kicker">Guess the city</span>
            <span className="menu-card-name">CityTap</span>
            <span className="menu-card-copy">
              A pin drops on the globe. Name the nearest city.
            </span>
            <span className="menu-card-cta">Play</span>
          </button>

          <button type="button" className="menu-card" onClick={() => onPick('mapzoom')}>
            <span className="menu-card-kicker">Guess the place</span>
            <span className="menu-card-name">MapZoom</span>
            <span className="menu-card-copy">
              A tight satellite view. Pin it on a globe before the map pulls back.
            </span>
            <span className="menu-card-cta">Play</span>
          </button>
        </div>
      </main>
    </div>
  );
}

export default MainMenu;
