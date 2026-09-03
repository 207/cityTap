const DIFFICULTY_KEY = 'citysnipe-difficulty';
const ZOOM_KEY = 'citysnipe-hard-zoom';

export const HARD_ZOOM_PRESETS = [5.8, 6.6, 7.5];
export const HARD_ZOOM_DEFAULT = 5.8;
export const SHOW_HARD_ZOOM_CONTROLS = import.meta.env.DEV;

export function readDifficulty() {
  try {
    const saved = localStorage.getItem(DIFFICULTY_KEY);
    if (saved === 'hard' || saved === 'easy') return saved;
  } catch {
    // Ignore blocked storage
  }
  return 'easy';
}

export function writeDifficulty(value) {
  if (value !== 'hard' && value !== 'easy') return;
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
