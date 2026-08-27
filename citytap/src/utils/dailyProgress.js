const STORAGE_KEY = 'citytap-daily';

function cityKey(city) {
  if (!city || typeof city.lat !== 'number' || typeof city.lng !== 'number') return '';
  return `${city.name}|${city.lat}|${city.lng}`;
}

function isValidProgress(data, dayNumber) {
  if (data?.dayNumber !== dayNumber || !Array.isArray(data.rounds)) return false;
  if (data.rounds.length > 5) return false;

  const answers = data.rounds.map((round) => cityKey(round?.correctCity));
  if (answers.some((key) => !key)) return false;
  if (new Set(answers).size !== data.rounds.length) return false;

  const finished = data.gameState === 'results' || data.gameState === 'review';
  if (finished && data.rounds.length !== 5) return false;

  return true;
}

function clearDailyProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore blocked storage
  }
}

export function loadDailyProgress(dayNumber) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!isValidProgress(data, dayNumber)) {
      clearDailyProgress();
      return null;
    }
    return data;
  } catch {
    clearDailyProgress();
    return null;
  }
}

export function saveDailyProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore blocked storage
  }
}

export function isDailyFinished(dayNumber) {
  const data = loadDailyProgress(dayNumber);
  return data?.gameState === 'results' || data?.gameState === 'review';
}
