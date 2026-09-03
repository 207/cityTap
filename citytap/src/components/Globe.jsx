import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const REVEAL_LINE_ID = 'reveal-line';
const RECAP_LINE_ID = 'recap-lines';

const EASY_PLAY_ZOOM = 5;
const RECAP_ZOOM = 1.38;
const RECAP_CENTER = [18, 16];
const PIN_FLY_MS = 3200;
const FIT_BOTH_MS = 1600;
const FLY_CORRECT_MS = 1300;
const HOLD_CORRECT_MS = 750;
const SETTLE_MS = 1400;
const INTERACT_HANDLERS = [
  'dragPan',
  'scrollZoom',
  'boxZoom',
  'dragRotate',
  'keyboard',
  'doubleClickZoom',
  'touchZoomRotate',
  'touchPitch'
];

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

function styleReady(instance) {
  try {
    return Boolean(instance?.getStyle() && instance.isStyleLoaded());
  } catch {
    return false;
  }
}

function setMapLocked(instance, locked) {
  if (!instance) return;
  INTERACT_HANDLERS.forEach((name) => {
    const handler = instance[name];
    if (!handler) return;
    if (locked) handler.disable();
    else handler.enable();
  });
}

function clearLine(instance, id) {
  if (!styleReady(instance)) return;
  if (instance.getLayer(id)) instance.removeLayer(id);
  if (instance.getSource(id)) instance.removeSource(id);
}

function setLineLayer(instance, id, data) {
  if (!styleReady(instance)) return;
  const source = instance.getSource(id);
  if (source) {
    source.setData(data);
    return;
  }

  instance.addSource(id, { type: 'geojson', data });
  instance.addLayer({
    id,
    type: 'line',
    source: id,
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#fbbf24',
      'line-width': 3,
      'line-opacity': id === RECAP_LINE_ID ? 0.72 : 0.95,
      'line-dasharray': [2, 1.4]
    }
  });
}

function setRevealLine(instance, guess, correct) {
  setLineLayer(instance, REVEAL_LINE_ID, {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: revealLineCoords(guess, correct)
    }
  });
}

function setRecapLines(instance, rounds) {
  const features = (rounds ?? [])
    .filter((round) => round?.guessedCity && round?.correctCity)
    .map((round) => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: revealLineCoords(round.guessedCity, round.correctCity)
      }
    }));

  setLineLayer(instance, RECAP_LINE_ID, {
    type: 'FeatureCollection',
    features
  });
}

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

function Globe({
  currentCity,
  guessedCities,
  correctCities,
  revealPair,
  intro = false,
  hard = false,
  hardZoom = 5.8,
  bearing = 0,
  pitch = 0,
  recap = false,
  cover = false,
  rounds = [],
  focusKey
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const revealPins = useRef({ guessEl: null, correctEl: null });
  const introRef = useRef(intro);
  const recapRef = useRef(recap);
  const hardRef = useRef(hard);
  const userControlRef = useRef(false);
  introRef.current = intro;
  recapRef.current = recap;
  hardRef.current = hard;

  const [veil, setVeil] = useState(false);
  const locked = hard && !intro && !recap;

  useLayoutEffect(() => {
    if (cover || (hard && !intro && !recap && currentCity && !revealPair)) {
      setVeil(true);
    } else if (recap || intro) {
      setVeil(false);
    }
  }, [cover, hard, intro, recap, currentCity, revealPair, focusKey]);

  const clearMarkers = () => {
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];
    revealPins.current = { guessEl: null, correctEl: null };
  };

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return undefined;

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

    const markUserControl = (event) => {
      if (event?.originalEvent) userControlRef.current = true;
    };
    const releaseUserControl = () => {
      userControlRef.current = false;
    };

    instance.on('mousedown', markUserControl);
    instance.on('touchstart', markUserControl);
    instance.on('mouseup', releaseUserControl);
    instance.on('touchend', releaseUserControl);

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
      instance.off('mousedown', markUserControl);
      instance.off('touchstart', markUserControl);
      instance.off('mouseup', releaseUserControl);
      instance.off('touchend', releaseUserControl);
      instance.remove();
      if (map.current === instance) {
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setMapLocked(map.current, locked);
  }, [locked]);

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
      if (introRef.current) return;
      if (!styleReady(instance)) return;
      clearMarkers();

      if (currentCity && !revealPair && !recapRef.current) {
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

    syncMarkers();
    instance.once('load', syncMarkers);
    instance.once('idle', syncMarkers);
    return () => {
      instance.off('load', syncMarkers);
      instance.off('idle', syncMarkers);
    };
  }, [currentCity, guessedCities, correctCities, revealPair, intro, recap]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !(intro || recap)) return undefined;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;

    let raf = 0;
    let last = 0;
    let spinning = !recap;
    const degPerSec = recap ? 3.4 : 3.2;
    const spinDelay = recap
      ? setTimeout(() => {
          spinning = true;
        }, 1600)
      : 0;

    const tick = (now) => {
      if (!introRef.current && !recapRef.current) return;
      if (recapRef.current && !spinning) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (userControlRef.current && recapRef.current) {
        last = now;
        raf = requestAnimationFrame(tick);
        return;
      }
      if (!last) last = now;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (instance.loaded()) {
        const center = instance.getCenter();
        instance.jumpTo({
          center: [center.lng + degPerSec * dt, center.lat],
          zoom: recapRef.current ? Math.min(instance.getZoom(), RECAP_ZOOM + 0.15) : instance.getZoom(),
          pitch: recapRef.current ? 0 : instance.getPitch(),
          bearing: recapRef.current ? 0 : instance.getBearing()
        });
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(spinDelay);
    };
  }, [intro, recap]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return undefined;

    let cancelled = false;
    const timers = [];
    const later = (fn, ms) => {
      timers.push(setTimeout(fn, ms));
    };

    const moveCamera = () => {
      if (cancelled || introRef.current || !styleReady(instance)) return;

      if (recap) {
        setVeil(false);
        instance.stop();
        clearLine(instance, REVEAL_LINE_ID);
        setRecapLines(instance, rounds);
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        instance.easeTo({
          center: RECAP_CENTER,
          zoom: RECAP_ZOOM,
          pitch: 0,
          bearing: 0,
          duration: reduced ? 0 : 1800,
          essential: true
        });
        return;
      }

      clearLine(instance, RECAP_LINE_ID);

      if (revealPair?.guessedCity && revealPair?.correctCity) {
        setVeil(false);
        instance.stop();
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
          if (cancelled || !styleReady(instance)) return;
          instance.stop();
          pulseCorrect();
          instance.flyTo({
            center: [correct.lng, correct.lat],
            zoom: Math.min(6.4, Math.max(instance.getZoom() + 1.15, 5.1)),
            duration: FLY_CORRECT_MS,
            essential: true
          });

          later(() => {
            if (cancelled || !styleReady(instance)) return;
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

      clearLine(instance, REVEAL_LINE_ID);
      setRevealPinState(revealPins.current.guessEl, revealPins.current.correctEl);

      if (currentCity) {
        const target = currentCity;
        instance.stop();
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (hard) {
          setVeil(true);
          later(() => {
            if (cancelled || introRef.current) return;
            instance.jumpTo({
              center: [target.lng, target.lat],
              zoom: hardZoom,
              pitch,
              bearing
            });
            later(() => {
              if (!cancelled && !cover) setVeil(false);
            }, reduced ? 0 : 160);
          }, 40);
          return;
        }

        setVeil(false);
        later(() => {
          if (cancelled || introRef.current) return;
          instance.flyTo({
            center: [target.lng, target.lat],
            zoom: EASY_PLAY_ZOOM,
            pitch: 0,
            duration: reduced ? 0 : PIN_FLY_MS,
            curve: 1.7,
            essential: true
          });
        }, 32);
      }
    };

    let started = false;
    const tryMove = () => {
      if (cancelled || started) return;
      if (!styleReady(instance)) {
        later(tryMove, 50);
        return;
      }
      started = true;
      moveCamera();
    };

    tryMove();
    instance.once('load', tryMove);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      instance.off('load', tryMove);
    };
  }, [currentCity, revealPair, intro, focusKey, hard, hardZoom, bearing, pitch, recap, recap ? rounds.length : 0]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || intro || recap || revealPair || !hard || !currentCity) return;
    if (!styleReady(instance)) return;
    instance.jumpTo({
      center: [currentCity.lng, currentCity.lat],
      zoom: hardZoom,
      pitch,
      bearing
    });
  }, [hardZoom, hard, bearing, pitch, currentCity, intro, recap, revealPair]);

  const coverRef = useRef(false);

  useEffect(() => {
    if (coverRef.current && !cover) setVeil(false);
    coverRef.current = cover;
  }, [cover]);

  return (
    <div className={`globe-shell${intro ? ' is-intro' : ''}${locked ? ' is-locked' : ''}`}>
      <div
        ref={mapContainer}
        className="globe-root"
        style={{
          width: '100%',
          height: '100%'
        }}
      />
      <div className={`globe-veil${veil ? ' is-on' : ''}`} aria-hidden="true" />
    </div>
  );
}

export default Globe;
