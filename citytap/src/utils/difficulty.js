const DIFFICULTY_KEY = 'citysnipe-difficulty';
const ZOOM_KEY = 'citysnipe-hard-zoom';

export const DIFFICULTIES = ['easy', 'hard', 'diabolical'];
export const HARD_ZOOM_PRESETS = [5.8, 6.6, 7.5];
export const HARD_ZOOM_DEFAULT = 5.8;
export const SHOW_HARD_ZOOM_CONTROLS = import.meta.env.DEV;

export function isLockedDifficulty(difficulty) {
  return difficulty === 'hard' || difficulty === 'diabolical';
}

export function difficultyLabel(difficulty) {
  if (difficulty === 'hard') return 'Hard';
  if (difficulty === 'diabolical') return 'Diabolical';
  return 'Easy';
}

function orientationNoise(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/** Deterministic camera twist for diabolical rounds. */
export function getRoundOrientation(seedBase, roundIndex) {
  const bearing = Math.floor(orientationNoise(seedBase + roundIndex * 9176 + 111) * 360);
  const pitch = Math.floor(orientationNoise(seedBase + roundIndex * 9176 + 222) * 42);
  return { bearing, pitch };
}

export function readDifficulty() {
  try {
    const saved = localStorage.getItem(DIFFICULTY_KEY);
    if (DIFFICULTIES.includes(saved)) return saved;
  } catch {
    // Ignore blocked storage
  }
  return 'easy';
}

export function writeDifficulty(value) {
  if (!DIFFICULTIES.includes(value)) return;
  try {
    localStorage.setItem(DIFFICULTY_KEY, value);
  } catch {
    // Ignore blocked storage
  }
}

export function readHardZoom() {
  if (!SHOW_HARD_ZOOM_CONTROLS) return HARD_ZOOM_DEFAULT;
  try {
    const zoom = Number(localStorage.getItem(ZOOM_KEY));
    if (HARD_ZOOM_PRESETS.includes(zoom)) return zoom;
  } catch {
    // Ignore blocked storage
  }
  return HARD_ZOOM_DEFAULT;
}

export function writeHardZoom(value) {
  const zoom = HARD_ZOOM_PRESETS.includes(value) ? value : HARD_ZOOM_DEFAULT;
  try {
    localStorage.setItem(ZOOM_KEY, String(zoom));
  } catch {
    // Ignore blocked storage
  }
  return zoom;
}
