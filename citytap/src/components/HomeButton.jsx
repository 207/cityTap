function HomeButton({ onClick }) {
  return (
    <button type="button" className="game-home-btn" onClick={onClick} aria-label="All games">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M10 3 5 8l5 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Games
    </button>
  );
}

export default HomeButton;
