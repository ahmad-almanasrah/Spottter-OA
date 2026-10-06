import React, { useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import Map, { Source, Layer, Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_KEY || import.meta.env.VITE_MAPBOX_TOKEN || '';
mapboxgl.accessToken = MAPBOX_TOKEN;

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
      'line-color': '#f97316', // orange-500
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
    <div className="w-full h-[500px] mt-8 rounded-[2rem] overflow-hidden border border-stone-200 shadow-sm">
      <Map
        initialViewState={viewState}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <Source id="routeSource" type="geojson" data={data}>
          <Layer {...routeStyle} />
        </Source>

        {waypoints?.current && (
          <Marker longitude={waypoints.current[0]} latitude={waypoints.current[1]} color="#a8a29e" /> // stone-400
        )}
        {waypoints?.pickup && (
          <Marker longitude={waypoints.pickup[0]} latitude={waypoints.pickup[1]} color="#14b8a6" /> // teal-500
        )}
        {waypoints?.dropoff && (
          <Marker longitude={waypoints.dropoff[0]} latitude={waypoints.dropoff[1]} color="#f43f5e" /> // rose-500
        )}
      </Map>
    </div>
  );
}
