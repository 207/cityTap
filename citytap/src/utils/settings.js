const EXCLUDE_RUSSIA_KEY = 'citysnipe-exclude-russia';

export function readExcludeRussia() {
  try {
    const saved = localStorage.getItem(EXCLUDE_RUSSIA_KEY);
    return saved === 'true';
  } catch {
    return false;
  }
}

export function writeExcludeRussia(value) {
  try {
    localStorage.setItem(EXCLUDE_RUSSIA_KEY, String(Boolean(value)));
  } catch {
    // Ignore blocked storage
  }
}
