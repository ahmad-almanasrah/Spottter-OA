import React, { useMemo } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_KEY || '';

export default function RouteMap({ routeData }) {
  const { geometry, waypoints } = routeData;

  const data = useMemo(() => ({
    type: 'Feature',
    properties: {},
    geometry: geometry
  }), [geometry]);

  const routeStyle = {
    id: 'route',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#2563eb',
      'line-width': 6,
      'line-opacity': 0.8
    }
  };

  const viewState = useMemo(() => {
    if (!waypoints || !waypoints.current) return { longitude: -100, latitude: 40, zoom: 3 };
    return {
      longitude: waypoints.current[0],
      latitude: waypoints.current[1],
      zoom: 10
    };
  }, [waypoints]);

  return (
    <div className="w-full h-[500px] mt-8 rounded-2xl overflow-hidden border border-gray-200 shadow-lg ring-1 ring-black ring-opacity-5">
      <Map
        initialViewState={viewState}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <Source id="routeSource" type="geojson" data={data}>
          <Layer {...routeStyle} />
        </Source>

        {waypoints?.current && (
          <Marker longitude={waypoints.current[0]} latitude={waypoints.current[1]} color="#ef4444" />
        )}
        {waypoints?.pickup && (
          <Marker longitude={waypoints.pickup[0]} latitude={waypoints.pickup[1]} color="#10b981" />
        )}
        {waypoints?.dropoff && (
          <Marker longitude={waypoints.dropoff[0]} latitude={waypoints.dropoff[1]} color="#3b82f6" />
        )}
      </Map>
    </div>
  );
}
