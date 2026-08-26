import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function MysteryMap({ location, zoom, inset = false }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const prevLocation = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return undefined;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const instance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: location ? [location.lng, location.lat] : [0, 20],
      zoom: zoom ?? 16,
      pitch: 0,
      bearing: 0,
      interactive: false,
      attributionControl: true,
      fadeDuration: 0,
      dragPan: false,
      dragRotate: false,
      scrollZoom: false,
      boxZoom: false,
      doubleClickZoom: false,
      touchZoomRotate: false,
      keyboard: false
    });

    map.current = instance;

    const resize = () => instance.resize();
    instance.once('load', resize);
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      instance.remove();
      if (map.current === instance) map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance || !location) return undefined;

    const apply = () => {
      if (!instance.loaded()) return;
      const key = `${location.lat.toFixed(5)},${location.lng.toFixed(5)}`;
      const isNewPlace = prevLocation.current !== key;
      prevLocation.current = key;

      if (isNewPlace) {
        instance.jumpTo({
          center: [location.lng, location.lat],
          zoom,
          pitch: 0,
          bearing: 0
        });
        return;
      }

      instance.easeTo({
        zoom,
        duration: 1700,
        essential: true
      });
    };

    if (instance.loaded()) {
      apply();
      return undefined;
    }

    instance.once('load', apply);
    return () => instance.off('load', apply);
  }, [location, zoom]);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return undefined;
    const timer = setTimeout(() => instance.resize(), 420);
    return () => clearTimeout(timer);
  }, [inset]);

  return (
    <div className={`mystery-map${inset ? ' is-inset' : ''}`}>
      <div ref={mapContainer} className="mystery-map-canvas" />
    </div>
  );
}

export default MysteryMap;
