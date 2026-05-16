'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import { FOCUS_MAP_POINT_EVENT, type FocusMapPointDetail, type CategoryAverages } from '@/lib/map/events';
import { BarCard } from './BarCard';
import { Box } from '@chakra-ui/react';

type MapPoint = {
  id: string;
  placeId?: string | null;
  barName: string | null;
  name: string;
  latitude: number;
  longitude: number;
  averageRating: number;
  ratingCount: number;
  lastRatedAt?: string | null;
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
        placeId: point.placeId ?? null,
        barName: point.barName,
        name: point.name,
        averageRating: point.averageRating,
        ratingCount: point.ratingCount,
        lastRatedAt: point.lastRatedAt ?? null,
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
          placeId: feature.properties?.placeId ?? null,
          name: barName,
          latitude: coordinates[1],
          longitude: coordinates[0],
          averageRating: average,
          ratingCount: count,
          lastRatedAt: feature.properties?.lastRatedAt ?? null,
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
          aria-label="Centrer sur ma position"
          style={{
            zIndex: 10,
            width: '38px',
            height: '38px',
            borderRadius: 10,
            border: '1px solid #e4d4bb',
            background: '#fffaf3',
            boxShadow: '0 2px 8px rgba(61,36,9,0.10)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
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
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f6f1e6',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: '#fffaf3',
              border: '1px solid #e4d4bb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              boxShadow: '0 12px 40px rgba(61,36,9,0.10)',
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7a6248"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: -0.5,
              color: '#231608',
              margin: '0 0 8px',
            }}
          >
            Carte indisponible
          </h2>
          <p
            style={{
              fontSize: 13.5,
              color: '#7a6248',
              margin: '0 0 28px',
              lineHeight: 1.55,
              maxWidth: 268,
            }}
          >
            <code
              style={{
                fontFamily: '"Geist Mono",ui-monospace,monospace',
                fontSize: 12,
                background: '#fffaf3',
                padding: '2px 6px',
                borderRadius: 4,
                border: '1px solid #e4d4bb',
              }}
            >
              NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
            </code>{' '}
            manquant. Tu peux quand même noter une Guinness.
          </p>
          <a
            href="/rate"
            style={{
              height: 50,
              padding: '0 26px',
              borderRadius: 25,
              background: '#130b02',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 15,
              fontWeight: 600,
              color: '#fdecc5',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 4px 22px rgba(15,23,42,0.24)',
              textDecoration: 'none',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fdecc5"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Noter une Guinness
          </a>
        </div>
      )}
    </div>
  )
}
