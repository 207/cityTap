import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const REVEAL_LINE_ID = 'reveal-line';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createPinElement({ className, size, backgroundColor, backgroundImage }) {
  const wrap = document.createElement('div');
  wrap.className = `${className}-wrap`;
  wrap.style.width = `${size}px`;
  wrap.style.height = `${size}px`;

  const el = document.createElement('div');
  el.className = className;
  el.style.width = '100%';
  el.style.height = '100%';
  if (backgroundImage) {
    el.style.backgroundImage = `url(${backgroundImage})`;
    el.style.backgroundSize = 'cover';
  } else {
    el.style.backgroundColor = backgroundColor;
    el.style.borderRadius = '50%';
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
  }
  wrap.appendChild(el);
  return wrap;
}

function cityPopup(city) {
  return `<strong>${escapeHtml(city.name)}</strong><br/>${escapeHtml(city.country)}`;
}

function revealLineCoords(guess, correct) {
  let lng1 = guess.lng;
  let lng2 = correct.lng;
  if (lng2 - lng1 > 180) lng2 -= 360;
  if (lng1 - lng2 > 180) lng2 += 360;
  return [[lng1, guess.lat], [lng2, correct.lat]];
}

function clearRevealLine(instance) {
  if (!instance || !instance.getStyle()) return;
  if (instance.getLayer(REVEAL_LINE_ID)) {
    instance.removeLayer(REVEAL_LINE_ID);
  }
  if (instance.getSource(REVEAL_LINE_ID)) {
    instance.removeSource(REVEAL_LINE_ID);
  }
}

function setRevealLine(instance, guess, correct) {
  const data = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: revealLineCoords(guess, correct)
    }
  };

  const source = instance.getSource(REVEAL_LINE_ID);
  if (source) {
    source.setData(data);
    return;
  }

  instance.addSource(REVEAL_LINE_ID, { type: 'geojson', data });
  instance.addLayer({
    id: REVEAL_LINE_ID,
    type: 'line',
    source: REVEAL_LINE_ID,
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#fbbf24',
      'line-width': 3,
      'line-opacity': 0.95,
      'line-dasharray': [2, 1.4]
    }
  });
}

const FIT_BOTH_MS = 1600;
const FLY_CORRECT_MS = 1300;
const HOLD_CORRECT_MS = 750;
const SETTLE_MS = 1400;

function isSameCity(a, b) {
  return a && b && a.lat === b.lat && a.lng === b.lng && a.name === b.name;
}

function fitBothPins(instance, guess, correct, duration) {
  try {
    const bounds = new mapboxgl.LngLatBounds();
    revealLineCoords(guess, correct).forEach((coord) => bounds.extend(coord));
    instance.fitBounds(bounds, {
      padding: { top: 140, bottom: 280, left: 72, right: 72 },
      duration,
      maxZoom: 7,
      essential: true
    });
  } catch {
    instance.flyTo({
      center: [
        (guess.lng + correct.lng) / 2,
        (guess.lat + correct.lat) / 2
      ],
      zoom: 2.2,
      duration,
      essential: true
    });
  }
}

function setRevealPinState(guessEl, correctEl, { dimGuess = false, pulseCorrect = false } = {}) {
  if (guessEl) guessEl.classList.toggle('reveal-dim', dimGuess);
  if (!correctEl) return;
  correctEl.classList.remove('reveal-pulse');
  if (pulseCorrect) {
    void correctEl.offsetWidth;
    correctEl.classList.add('reveal-pulse');
  }
}

function Globe({ currentCity, guessedCities, correctCities, revealPair, intro = false, focusKey }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const revealPins = useRef({ guessEl: null, correctEl: null });
  const introRef = useRef(intro);
  introRef.current = intro;

  const clearMarkers = () => {
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    revealPins.current = { guessEl: null, correctEl: null };
  };

  useEffect(() => {
    if (!mapContainer.current) return undefined;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const instance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      projection: 'globe',
      center: [20, 18],
      zoom: 1.45,
      pitch: 0,
      bearing: 0,
      fadeDuration: 0
    });

    map.current = instance;

    instance.on('style.load', () => {
      instance.setFog({
        color: 'rgb(186, 210, 235)',
        'high-color': 'rgb(36, 92, 223)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(11, 11, 25)',
        'star-intensity': 0.6
      });
    });

    return () => {
      clearMarkers();
      instance.remove();
      if (map.current === instance) {
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return undefined;

    const addMarker = (city, options, popupHtml) => {
      if (city?.lng == null || city?.lat == null) return null;
      const marker = new mapboxgl.Marker(createPinElement(options))
        .setLngLat([city.lng, city.lat]);
      if (popupHtml) {
        marker.setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupHtml));
      }
      marker.addTo(instance);
      markers.current.push(marker);
      return marker;
    };

    const syncMarkers = () => {
      if (!instance.loaded() || introRef.current) return;
      clearMarkers();

      const currentAlreadyRevealed = currentCity && correctCities.some((city) => isSameCity(city, currentCity));

      if (currentCity && !currentAlreadyRevealed) {
        addMarker(currentCity, {
          className: 'mystery-pin',
          size: 30,
          backgroundImage: 'https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png'
        });
      }

      correctCities.forEach((city) => {
        const marker = addMarker(
          city,
          { className: 'correct-pin', size: 22, backgroundColor: '#22c55e' },
          cityPopup(city)
        );
        if (marker && isSameCity(city, revealPair?.correctCity)) {
          revealPins.current.correctEl = marker.getElement().querySelector('.correct-pin');
        }
      });

      guessedCities.forEach((city) => {
        const marker = addMarker(
          city,
          { className: 'guess-pin', size: 22, backgroundColor: '#3b82f6' },
          cityPopup(city)
        );
        if (marker && isSameCity(city, revealPair?.guessedCity)) {
          revealPins.current.guessEl = marker.getElement().querySelector('.guess-pin');
        }
      });
    };

    if (instance.loaded()) {
      syncMarkers();
      return undefined;
    }

    instance.once('load', syncMarkers);
    return () => instance.off('load', syncMarkers);
  }, [currentCity, guessedCities, correctCities, revealPair, intro]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !intro) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    let raf = 0;
    let last = 0;
    const degPerSec = 3.2;

    const tick = (now) => {
      if (!introRef.current) return;
      if (!last) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (instance.loaded()) {
        const center = instance.getCenter();
        instance.jumpTo({ center: [center.lng + degPerSec * dt, center.lat] });
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [intro]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return undefined;

    let cancelled = false;
    const timers = [];
    const later = (fn, ms) => {
      timers.push(setTimeout(fn, ms));
    };

    const moveCamera = () => {
      if (cancelled || !instance.loaded() || introRef.current) return;
      instance.stop();

      if (revealPair?.guessedCity && revealPair?.correctCity) {
        const guess = revealPair.guessedCity;
        const correct = revealPair.correctCity;
        setRevealLine(instance, guess, correct);

        const pulseCorrect = () => {
          setRevealPinState(revealPins.current.guessEl, revealPins.current.correctEl, {
            dimGuess: true,
            pulseCorrect: true
          });
        };

        const samePoint =
          Math.abs(guess.lat - correct.lat) < 0.002 &&
          Math.abs(guess.lng - correct.lng) < 0.002;

        if (samePoint) {
          instance.flyTo({
            center: [correct.lng, correct.lat],
            zoom: 6,
            duration: 1400,
            essential: true
          });
          later(pulseCorrect, 400);
          return;
        }

        fitBothPins(instance, guess, correct, FIT_BOTH_MS);

        later(() => {
          if (cancelled || !instance.loaded()) return;
          instance.stop();
          pulseCorrect();
          instance.flyTo({
            center: [correct.lng, correct.lat],
            zoom: Math.min(6.4, Math.max(instance.getZoom() + 1.15, 5.1)),
            duration: FLY_CORRECT_MS,
            essential: true
          });

          later(() => {
            if (cancelled || !instance.loaded()) return;
            instance.stop();
            setRevealPinState(revealPins.current.guessEl, revealPins.current.correctEl, {
              dimGuess: false,
              pulseCorrect: false
            });
            fitBothPins(instance, guess, correct, SETTLE_MS);
          }, FLY_CORRECT_MS + HOLD_CORRECT_MS);
        }, FIT_BOTH_MS + 80);
        return;
      }

      clearRevealLine(instance);
      setRevealPinState(revealPins.current.guessEl, revealPins.current.correctEl);

      if (currentCity) {
        const target = currentCity;
        later(() => {
          if (cancelled || !instance.loaded() || introRef.current) return;
          instance.flyTo({
            center: [target.lng, target.lat],
            zoom: 5,
            duration: 2400,
            essential: true
          });
        }, 40);
      }
    };

    if (instance.loaded()) {
      moveCamera();
    } else {
      instance.once('load', moveCamera);
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      instance.off('load', moveCamera);
      if (instance.getStyle()) instance.stop();
    };
  }, [currentCity, revealPair, intro, focusKey]);

  return (
    <div
      ref={mapContainer}
      className={`globe-root${intro ? ' is-intro' : ''}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    />
  );
}

export default Globe;
