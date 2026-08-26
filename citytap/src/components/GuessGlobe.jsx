import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const REVEAL_LINE_ID = 'mapzoom-reveal-line';

function createPinElement({ className, size, backgroundColor }) {
  const wrap = document.createElement('div');
  wrap.className = `${className}-wrap`;
  wrap.style.width = `${size}px`;
  wrap.style.height = `${size}px`;

  const el = document.createElement('div');
  el.className = className;
  el.style.width = '100%';
  el.style.height = '100%';
  el.style.backgroundColor = backgroundColor;
  el.style.borderRadius = '50%';
  el.style.border = '2px solid white';
  el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
  wrap.appendChild(el);
  return wrap;
}

function revealLineCoords(guess, correct) {
  let lng1 = guess.lng;
  let lng2 = correct.lng;
  if (lng2 - lng1 > 180) lng2 -= 360;
  if (lng1 - lng2 > 180) lng2 += 360;
  return [
    [lng1, guess.lat],
    [lng2, correct.lat]
  ];
}

function clearRevealLine(instance) {
  if (!instance || !instance.getStyle()) return;
  if (instance.getLayer(REVEAL_LINE_ID)) instance.removeLayer(REVEAL_LINE_ID);
  if (instance.getSource(REVEAL_LINE_ID)) instance.removeSource(REVEAL_LINE_ID);
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

function fitBothPins(instance, guess, correct) {
  try {
    const bounds = new mapboxgl.LngLatBounds();
    revealLineCoords(guess, correct).forEach((coord) => bounds.extend(coord));
    instance.fitBounds(bounds, {
      padding: { top: 140, bottom: 280, left: 72, right: 72 },
      duration: 1400,
      maxZoom: 7,
      essential: true
    });
  } catch {
    instance.flyTo({
      center: [(guess.lng + correct.lng) / 2, (guess.lat + correct.lat) / 2],
      zoom: 2.2,
      duration: 1400,
      essential: true
    });
  }
}

function GuessGlobe({ pin, onPinChange, interactive, revealPair, visible }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const guessMarker = useRef(null);
  const correctMarker = useRef(null);
  const pinRef = useRef(pin);
  const onPinChangeRef = useRef(onPinChange);
  const interactiveRef = useRef(interactive);

  pinRef.current = pin;
  onPinChangeRef.current = onPinChange;
  interactiveRef.current = interactive;

  useEffect(() => {
    if (!mapContainer.current) return undefined;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const instance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      projection: 'globe',
      center: [0, 20],
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

    const onClick = (event) => {
      if (!interactiveRef.current) return;
      onPinChangeRef.current?.({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng
      });
    };

    instance.on('click', onClick);

    const resize = () => instance.resize();
    instance.once('load', resize);
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      instance.off('click', onClick);
      guessMarker.current?.remove();
      correctMarker.current?.remove();
      instance.remove();
      if (map.current === instance) map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !visible) return undefined;
    const timer = setTimeout(() => instance.resize(), 60);
    return () => clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return undefined;

    const syncGuess = () => {
      if (!instance.loaded()) return;

      if (!pin) {
        guessMarker.current?.remove();
        guessMarker.current = null;
        return;
      }

      if (guessMarker.current) {
        guessMarker.current.setLngLat([pin.lng, pin.lat]);
        guessMarker.current.setDraggable(Boolean(interactive));
        return;
      }

      const marker = new mapboxgl.Marker({
        element: createPinElement({ className: 'guess-pin', size: 22, backgroundColor: '#3b82f6' }),
        draggable: Boolean(interactive)
      })
        .setLngLat([pin.lng, pin.lat])
        .addTo(instance);

      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        onPinChangeRef.current?.({ lat: lngLat.lat, lng: lngLat.lng });
      });

      guessMarker.current = marker;
    };

    if (instance.loaded()) {
      syncGuess();
      return undefined;
    }

    instance.once('load', syncGuess);
    return () => instance.off('load', syncGuess);
  }, [pin, interactive]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return undefined;

    const syncReveal = () => {
      if (!instance.loaded()) return;
      instance.stop();

      correctMarker.current?.remove();
      correctMarker.current = null;

      if (!revealPair?.correct) {
        clearRevealLine(instance);
        return;
      }

      const correct = revealPair.correct;
      const marker = new mapboxgl.Marker({
        element: createPinElement({ className: 'correct-pin', size: 22, backgroundColor: '#22c55e' }),
        draggable: false
      })
        .setLngLat([correct.lng, correct.lat])
        .addTo(instance);
      correctMarker.current = marker;

      if (revealPair.guess) {
        setRevealLine(instance, revealPair.guess, correct);
        fitBothPins(instance, revealPair.guess, correct);
        return;
      }

      clearRevealLine(instance);
      instance.flyTo({
        center: [correct.lng, correct.lat],
        zoom: 5.2,
        duration: 1400,
        essential: true
      });
    };

    if (instance.loaded()) {
      syncReveal();
      return undefined;
    }

    instance.once('load', syncReveal);
    return () => instance.off('load', syncReveal);
  }, [revealPair]);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !visible || revealPair) return undefined;

    const resetView = () => {
      if (!instance.loaded()) return;
      instance.stop();
      instance.easeTo({
        center: [0, 20],
        zoom: 1.45,
        pitch: 0,
        bearing: 0,
        duration: 700,
        essential: true
      });
    };

    if (instance.loaded()) {
      resetView();
      return undefined;
    }

    instance.once('load', resetView);
    return () => instance.off('load', resetView);
  }, [visible, revealPair]);

  return (
    <div className={`guess-globe${visible ? ' is-visible' : ''}${interactive ? ' is-picking' : ''}`}>
      <div ref={mapContainer} className="guess-globe-canvas" />
    </div>
  );
}

export default GuessGlobe;
