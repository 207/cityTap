import { calculateDistance, getAllCities, getDayNumber, getScoreEmoji } from './gameLogic';

const cities = getAllCities();

export const TOTAL_ROUNDS = 5;

/**
 * Five looks per round. Early guesses are worth more, but a miss
 * (or "I don't know") pulls the camera back and lowers the ceiling.
 *
 * Hit radius is "did you find the place?", not pin-pixel precision.
 * Inside the radius, score eases from 100% at 0 km down to 70% at the edge.
 * The last look always locks in, with a long-tail distance curve.
 */
export const ZOOM_STAGES = [
  { zoom: 16.2, maxScore: 100, hitRadiusKm: 50, label: 'Street' },
  { zoom: 13.6, maxScore: 78, hitRadiusKm: 120, label: 'District' },
  { zoom: 10.9, maxScore: 54, hitRadiusKm: 280, label: 'City' },
  { zoom: 7.7, maxScore: 30, hitRadiusKm: 750, label: 'Region' },
  { zoom: 4.35, maxScore: 14, hitRadiusKm: Infinity, label: 'World', last: true }
];

export const LAST_STAGE_INDEX = ZOOM_STAGES.length - 1;

function interpolateScore(distanceKm, points) {
  if (distanceKm <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [d0, s0] = points[i - 1];
    const [d1, s1] = points[i];
    if (distanceKm <= d1) {
      const t = (distanceKm - d0) / (d1 - d0);
      return s0 + t * (s1 - s0);
    }
  }
  return points[points.length - 1][1];
}

const LAST_LOOK_CURVE = [
  [0, 14],
  [25, 13],
  [80, 12],
  [250, 10],
  [700, 7],
  [1600, 4],
  [4000, 1],
  [12000, 0]
];

function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pickUnique(pool, count, rng) {
  const remaining = [...pool];
  const selected = [];
  const n = Math.min(count, remaining.length);

  for (let i = 0; i < n; i++) {
    const index = Math.floor(rng(i) * remaining.length);
    selected.push(remaining.splice(index, 1)[0]);
  }

  return selected;
}

function offsetLocation(city, seed) {
  const distDeg = 0.004 + seededRandom(seed) * 0.006;
  const theta = seededRandom(seed + 17) * Math.PI * 2;
  const cosLat = Math.max(0.2, Math.cos((city.lat * Math.PI) / 180));
  return {
    name: city.name,
    country: city.country,
    pop: city.pop,
    lat: city.lat + distDeg * Math.cos(theta),
    lng: city.lng + (distDeg * Math.sin(theta)) / cosLat
  };
}

export function getDailyLocations(dayNumber = getDayNumber()) {
  const seed = dayNumber + 98765;
  return pickUnique(cities, TOTAL_ROUNDS, (i) => seededRandom(seed + i * 97)).map((city, i) =>
    offsetLocation(city, seed + i * 13)
  );
}

export function getRandomLocations(count = TOTAL_ROUNDS) {
  return pickUnique(cities, count, () => Math.random()).map((city, i) =>
    offsetLocation(city, Math.floor(Math.random() * 1_000_000) + i)
  );
}

export function evaluateGuess(distanceKm, stageIndex) {
  const stage = ZOOM_STAGES[stageIndex] ?? ZOOM_STAGES[LAST_STAGE_INDEX];

  if (stage.last) {
    return {
      hit: true,
      score: Math.min(stage.maxScore, Math.max(0, Math.round(interpolateScore(distanceKm, LAST_LOOK_CURVE))))
    };
  }

  if (distanceKm > stage.hitRadiusKm) {
    return { hit: false, score: 0 };
  }

  const t = Math.min(1, distanceKm / stage.hitRadiusKm);
  return {
    hit: true,
    score: Math.round(stage.maxScore * (1 - 0.3 * t))
  };
}

export function scoreGuess(guess, location, stageIndex) {
  const distance = calculateDistance(guess.lat, guess.lng, location.lat, location.lng);
  const result = evaluateGuess(distance, stageIndex);
  return { ...result, distance };
}

export function generateMapZoomShareText(rounds, dayNumber) {
  const emojis = rounds.map((round) => getScoreEmoji(round.score)).join('  ');
  const totalScore = rounds.reduce((sum, round) => sum + round.score, 0);
  return `MapZoom #${dayNumber}\n${emojis}\nTotal: ${totalScore}/500`;
}
