const STORAGE_KEY = 'citytap-daily';

function cityKey(city) {
  if (!city || typeof city.lat !== 'number' || typeof city.lng !== 'number') return '';
  return `${city.name}|${city.lat}|${city.lng}`;
}

function slotName(difficulty) {
  if (difficulty === 'hard') return 'hard';
  if (difficulty === 'diabolical') return 'diabolical';
  return 'easy';
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

function emptyStore(dayNumber) {
  return { dayNumber, easy: null, hard: null, diabolical: null };
}

function clearDailyProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore blocked storage
  }
}

function readStore(dayNumber) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore(dayNumber);
    const data = JSON.parse(raw);
    if (data?.dayNumber !== dayNumber) {
      clearDailyProgress();
      return emptyStore(dayNumber);
    }

    if (Array.isArray(data.rounds)) {
      return {
        dayNumber,
        easy: isValidProgress(data, dayNumber) ? data : null,
        hard: null,
        diabolical: null
      };
    }

    const easy = data.easy && isValidProgress({ ...data.easy, dayNumber }, dayNumber) ? data.easy : null;
    const hard = data.hard && isValidProgress({ ...data.hard, dayNumber }, dayNumber) ? data.hard : null;
    const diabolical = data.diabolical && isValidProgress({ ...data.diabolical, dayNumber }, dayNumber)
      ? data.diabolical
      : null;
    return { dayNumber, easy, hard, diabolical };
  } catch {
    clearDailyProgress();
    return emptyStore(dayNumber);
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore blocked storage
  }
}

export function loadDailyProgress(dayNumber, difficulty = 'easy') {
  return readStore(dayNumber)[slotName(difficulty)];
}

export function saveDailyProgress(progress, difficulty = 'easy') {
  if (!progress?.dayNumber) return;
  const store = readStore(progress.dayNumber);
  store[slotName(difficulty)] = progress;
  writeStore(store);
}

export function isDailyFinished(dayNumber, difficulty = 'easy') {
  const data = loadDailyProgress(dayNumber, difficulty);
  return data?.gameState === 'results' || data?.gameState === 'review';
}

export function isDailyInProgress(dayNumber, difficulty = 'easy') {
  if (isDailyFinished(dayNumber, difficulty)) return false;
  const data = loadDailyProgress(dayNumber, difficulty);
  return (data?.rounds?.length ?? 0) > 0 || data?.gameState === 'reveal';
}
