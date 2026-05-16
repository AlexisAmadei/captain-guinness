'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import { FOCUS_MAP_POINT_EVENT, type FocusMapPointDetail, type CategoryAverages } from '@/lib/map/events';
import { BarCard } from './BarCard';
import { Box } from '@chakra-ui/react';

type MapPoint = {
  id: string;
  barName: string | null;
  name: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  ratingCount: number;
  categoryAverages?: CategoryAverages;
}

type RatingsMapResponse = {
  points: MapPoint[];
}

const SOURCE_ID = 'landing-ratings'
const LAYER_ID = 'landing-ratings-circles'

function toGeoJson(points: MapPoint[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.longitude, point.latitude],
      },
      properties: {
        id: point.id,
        barName: point.barName,
        name: point.name,
        averageRating: point.averageRating,
        ratingCount: point.ratingCount,
        categoryAverages: point.categoryAverages ?? null,
      },
    })),
  }
}

export function ratingColor(rating: number): string {
  if (rating >= 4) return '#16a34a'
  if (rating >= 3) return '#ca8a04'
  if (rating >= 2) return '#f97316'
  return '#dc2626'
}

export default function Map() {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const geolocateRef = useRef<mapboxgl.GeolocateControl | null>(null)
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const [activePoint, setActivePoint] = useState<FocusMapPointDetail | null>(null)

  useEffect(() => {
    if (!accessToken || !mapContainerRef.current || mapRef.current) {
      return
    }

    mapboxgl.accessToken = accessToken
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [2.34462, 48.85944],
      zoom: 12.28,
      attributionControl: false,
    });
    mapRef.current = map

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    })
    map.addControl(geolocate)
    geolocateRef.current = geolocate

    // Centre on user once the map and geolocation are both ready
    map.once('load', () => {
      geolocate.trigger()
    })

    const focusMapPoint = (point: FocusMapPointDetail) => {
      map.easeTo({
        center: [point.longitude, point.latitude],
        zoom: Math.max(map.getZoom(), 14),
        duration: 700,
        essential: true,
      })
      setActivePoint(point)
    }

    const handleFocusEvent = (event: Event) => {
      const { detail } = event as CustomEvent<FocusMapPointDetail>
      if (!detail) return
      focusMapPoint(detail)
    }

    window.addEventListener(FOCUS_MAP_POINT_EVENT, handleFocusEvent)

    // Dismiss card on blank map click
    map.on('click', (event) => {
      const features = map.queryRenderedFeatures(event.point, { layers: [LAYER_ID] })
      if (features.length === 0) setActivePoint(null)
    })

    map.on('load', () => {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: toGeoJson([]),
      })

      map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-color': [
            'step',
            ['get', 'averageRating'],
            '#dc2626',
            2,
            '#f97316',
            3,
            '#facc15',
            4,
            '#16a34a',
          ],
          'circle-radius': ['interpolate', ['linear'], ['get', 'ratingCount'], 1, 8, 20, 16],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      map.on('mouseenter', LAYER_ID, () => {
        map.getCanvas().style.cursor = 'pointer'
      })

      map.on('mouseleave', LAYER_ID, () => {
        map.getCanvas().style.cursor = ''
      })

      map.on('click', LAYER_ID, (event) => {
        const feature = event.features?.[0]
        if (!feature || feature.geometry.type !== 'Point') return

        const coordinates = feature.geometry.coordinates as [number, number]
        const barName = String(feature.properties?.barName ?? feature.properties?.name ?? 'Lieu')
        const average = Number(feature.properties?.averageRating ?? 0)
        const count = Number(feature.properties?.ratingCount ?? 0)

        let categoryAverages: CategoryAverages | undefined
        const rawCat = feature.properties?.categoryAverages
        if (rawCat) {
          try {
            categoryAverages = typeof rawCat === 'string' ? JSON.parse(rawCat) : rawCat
          } catch {
            // ignore malformed data
          }
        }

        focusMapPoint({
          id: String(feature.properties?.id ?? ''),
          name: barName,
          latitude: coordinates[1],
          longitude: coordinates[0],
          averageRating: average,
          ratingCount: count,
          categoryAverages,
        })
      })

      fetch('/api/ratings/map?scope=all')
        .then(async (response) => {
          if (!response.ok) throw new Error('Failed to load ratings map points')
          return (await response.json()) as RatingsMapResponse
        })
        .then((payload) => {
          const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
          if (!source) return
          source.setData(toGeoJson(payload.points ?? []))
        })
        .catch(() => {
          // Keep basemap visible even if ratings fetch fails.
        })
    })

    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.resize()
    })
    resizeObserver.observe(mapContainerRef.current)

    return () => {
      window.removeEventListener(FOCUS_MAP_POINT_EVENT, handleFocusEvent)
      resizeObserver.disconnect()
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [accessToken])

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <style>{`
        @keyframes barCardIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div id='map-container' ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      <Box
        position="fixed"
        bottom={{ base: 4, md: 5 }}
        right={{ base: 3, md: 5 }}
      >
        <button
          onClick={() => geolocateRef.current?.trigger()}
          style={{
            // position: 'absolute',
            // bottom: '18px',
            // right: '10px',
            zIndex: 10,
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: 'white',
            boxShadow: '0 0 0 2px rgba(0,0,0,.1)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Center on my position"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="8" />
          </svg>
        </button>
      </Box>

      {activePoint && (
        <BarCard point={activePoint} onClose={() => setActivePoint(null)} />
      )}

      {!accessToken && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f6f0e7',
            color: '#c23b39',
            fontWeight: 600,
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          Missing Mapbox token.
        </div>
      )}
    </div>
  )
}
