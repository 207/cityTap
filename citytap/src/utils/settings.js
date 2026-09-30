const EXCLUDE_RUSSIA_KEY = 'citysnipe-exclude-russia';

export function readExcludeRussia() {
  try {
    const saved = localStorage.getItem(EXCLUDE_RUSSIA_KEY);
    if (saved === null) return true; // Default to true
    return saved === 'true';
  } catch {
    return true; // Default to true
  }
}

export function writeExcludeRussia(value) {
  try {
    localStorage.setItem(EXCLUDE_RUSSIA_KEY, String(Boolean(value)));
  } catch {
    // Ignore blocked storage
  }
}
