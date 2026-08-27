import allCities from '../data/cities.json';
import { COUNTRY_POPULATIONS } from '../data/countryPopulations.js';

const MIN_EXTRA_CITY_POP = 150_000;
const EXTRA_CITY_SHARE_OF_LARGEST = 0.08;
const EXTRA_CITY_SHARE_CAP = 1_000_000;

function isNotableExtraCity(city, largestPop) {
  const relativeFloor = Math.min(largestPop * EXTRA_CITY_SHARE_OF_LARGEST, EXTRA_CITY_SHARE_CAP);
  return city.pop >= MIN_EXTRA_CITY_POP && city.pop >= relativeFloor;
}

export function cityQuotaForCountryPop(countryPop) {
  if (!countryPop || countryPop < 4_000_000) return 1;
  if (countryPop < 20_000_000) return 2;
  if (countryPop < 80_000_000) return 3;
  if (countryPop < 200_000_000) return 5;
  return 8;
}

export function buildPlayableCities(source = allCities) {
  const byCountry = new Map();
  for (const city of source) {
    const list = byCountry.get(city.country);
    if (list) list.push(city);
    else byCountry.set(city.country, [city]);
  }

  const playable = [];
  for (const [country, list] of byCountry) {
    const ranked = [...list].sort((a, b) => b.pop - a.pop);
    const quota = cityQuotaForCountryPop(COUNTRY_POPULATIONS[country]);
    const largestPop = ranked[0]?.pop ?? 0;
    let taken = 0;
    for (const city of ranked) {
      if (taken >= quota) break;
      if (taken === 0 || isNotableExtraCity(city, largestPop)) {
        playable.push(city);
        taken += 1;
      }
    }
  }
  return playable;
}

const cities = buildPlayableCities();

// Haversine formula for great-circle distance
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

// One exponential: 100 at 0 km, 80 at 300 km.
// 100 * exp(-300 / k) = 80  ⇒  k = 300 / -ln(0.8) ≈ 1344.28 km
export const SCORE_DECAY_KM = 300 / -Math.log(0.8);

export function calculateScore(distanceKm) {
  return 100 * Math.exp(-distanceKm / SCORE_DECAY_KM);
}

export function calculateFinalScore(distanceKm) {
  return Math.min(100, Math.max(0, Math.round(calculateScore(distanceKm))));
}

// Simple deterministic pseudo-random number generator
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Get day number since epoch
export function getDayNumber() {
  const now = new Date();
  const start = new Date(2024, 0, 1); // Jan 1, 2024
  const diff = now - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function pickUnique(pool, count, rng) {
  const remaining = [...pool];
  const selectedCities = [];
  const n = Math.min(count, remaining.length);

  for (let i = 0; i < n; i++) {
    const index = Math.floor(rng(i) * remaining.length);
    selectedCities.push(remaining.splice(index, 1)[0]);
  }

  return selectedCities;
}

export function getDailyCities(dayNumber = getDayNumber()) {
  const seed = dayNumber + 12345;
  return pickUnique(cities, 5, (i) => seededRandom(seed + i * 100));
}

export function getRandomCities(count = 5) {
  return pickUnique(cities, count, () => Math.random());
}

// Get emoji for score
export function getScoreEmoji(score) {
  if (score >= 80) return '🟩';
  if (score >= 50) return '🟨';
  if (score >= 20) return '🟧';
  return '🟥';
}

// Generate shareable result text
export function getScoreTone(score) {
  if (score >= 80) return 'good';
  if (score >= 50) return 'ok';
  if (score >= 20) return 'fair';
  return 'miss';
}

export function formatDistance(km) {
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}

export function generateShareText(rounds, dayNumber) {
  const emojis = rounds.map(r => getScoreEmoji(r.score)).join('  ');
  const totalScore = rounds.reduce((sum, r) => sum + r.score, 0);
  
  return `CityTap #${dayNumber}\n${emojis}\nTotal: ${totalScore}/500`;
}

function foldName(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function citySearchNames(city) {
  const names = [foldName(city.name)];
  if (city.ascii) names.push(foldName(city.ascii));
  return names;
}

let guessableCities = [];
const guessableReady = import('../data/guessableCities.json').then((mod) => {
  guessableCities = mod.default;
  return guessableCities;
});

export function loadGuessableCities() {
  return guessableReady;
}

// Autocomplete uses a wide world list. Daily/random pins still use `cities`.
export function searchCities(query) {
  const q = foldName(query).trim();
  if (!q || guessableCities.length === 0) return [];

  const starts = [];
  const partial = [];

  for (const city of guessableCities) {
    const names = citySearchNames(city);
    if (names.some((name) => name.startsWith(q))) starts.push(city);
    else if (names.some((name) => name.includes(q))) partial.push(city);
  }

  return [...starts, ...partial].slice(0, 12);
}

// Get all cities for reference
export function getAllCities() {
  return cities;
}
