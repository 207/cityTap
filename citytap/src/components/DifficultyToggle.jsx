import { HARD_ZOOM_PRESETS, SHOW_HARD_ZOOM_CONTROLS } from '../utils/difficulty';

function DifficultyToggle({ difficulty, onChange, hardZoom, onHardZoomChange }) {
  return (
    <div className="mode-toggle difficulty-toggle" role="group" aria-label="Difficulty">
      <span className="mode-toggle-label">Difficulty</span>
      <div className="mode-toggle-track">
        <button
          type="button"
          className={difficulty === 'easy' ? 'is-active' : ''}
          aria-pressed={difficulty === 'easy'}
          onClick={() => onChange('easy')}
        >
          Easy
        </button>
        <button
          type="button"
          className={difficulty === 'hard' ? 'is-active' : ''}
          aria-pressed={difficulty === 'hard'}
          onClick={() => onChange('hard')}
        >
          Hard
        </button>
      </div>
      {SHOW_HARD_ZOOM_CONTROLS && difficulty === 'hard' && onHardZoomChange && (
        <div className="hard-zoom" role="group" aria-label="Hard mode zoom for playtesting">
          <span className="hard-zoom-label">Zoom</span>
          {HARD_ZOOM_PRESETS.map((zoom) => (
            <button
              key={zoom}
              type="button"
              className={hardZoom === zoom ? 'is-active' : ''}
              aria-pressed={hardZoom === zoom}
              onClick={() => onHardZoomChange(zoom)}
            >
              {zoom}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default DifficultyToggle;
