function ModeToggle({ mode, onChange }) {
  return (
    <div className="mode-toggle" role="group" aria-label="Game mode for testing">
      <span className="mode-toggle-label">Test</span>
      <div className="mode-toggle-track">
        <button
          type="button"
          className={mode === 'daily' ? 'is-active' : ''}
          aria-pressed={mode === 'daily'}
          onClick={() => onChange('daily')}
        >
          Daily
        </button>
        <button
          type="button"
          className={mode === 'random' ? 'is-active' : ''}
          aria-pressed={mode === 'random'}
          onClick={() => onChange('random')}
        >
          Random
        </button>
      </div>
    </div>
  );
}

export default ModeToggle;
