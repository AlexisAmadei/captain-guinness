'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import { FOCUS_MAP_POINT_EVENT, type FocusMapPointDetail, type CategoryAverages } from '@/lib/map/events';

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

function ratingColor(rating: number): string {
  if (rating >= 4) return '#16a34a'
  if (rating >= 3) return '#ca8a04'
  if (rating >= 2) return '#f97316'
  return '#dc2626'
}

function StarDisplay({ value }: { value: number }) {
  const full = Math.floor(value)
  const half = value - full >= 0.25 && value - full < 0.75
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (i <= full) {
      stars.push(<span key={i} style={{ color: '#f59e0b' }}>★</span>)
    } else if (i === full + 1 && half) {
      stars.push(<span key={i} style={{ color: '#f59e0b' }}>½</span>)
    } else {
      stars.push(<span key={i} style={{ color: '#d1d5db' }}>★</span>)
    }
  }
  return <span style={{ fontSize: 16, letterSpacing: 1 }}>{stars}</span>
}

type BarCardProps = {
  point: FocusMapPointDetail
  onClose: () => void
}

function BarCard({ point, onClose }: BarCardProps) {
  const color = ratingColor(point.averageRating)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(4rem + env(safe-area-inset-bottom) + 0.75rem)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        width: 'min(22rem, calc(100vw - 2rem))',
        background: 'rgba(253,248,240,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 18,
        boxShadow: '0 8px 40px rgba(61,36,9,0.18), 0 1px 4px rgba(61,36,9,0.10)',
        overflow: 'hidden',
        animation: 'barCardIn 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Colour accent bar keyed to rating */}
      <div style={{ height: 4, background: color }} />

      <div style={{ padding: '16px 18px 18px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{
              margin: 0,
              fontWeight: 700,
              fontSize: 16,
              color: '#231608',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '16rem',
            }}>
              {point.name}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7a6248' }}>
              {point.ratingCount === 1 ? '1 rating' : `${point.ratingCount} ratings`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              flexShrink: 0,
              background: '#ede5d8',
              border: 'none',
              borderRadius: '50%',
              width: 28,
              height: 28,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: '#7a6248',
              marginTop: 2,
            }}
          >
            ✕
          </button>
        </div>

        {/* Score block */}
        <div style={{
          background: '#f0e8da',
          borderRadius: 12,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          {/* Big number */}
          <div style={{
            flexShrink: 0,
            width: 52,
            height: 52,
            borderRadius: 14,
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 20, lineHeight: 1 }}>
              {point.averageRating.toFixed(1)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10, lineHeight: 1.2 }}>/ 5</span>
          </div>

          <div>
            <StarDisplay value={point.averageRating} />
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#7a6248' }}>
              {point.averageRating >= 4
                ? 'Excellent'
                : point.averageRating >= 3
                  ? 'Good'
                  : point.averageRating >= 2
                    ? 'Average'
                    : 'Below average'}
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        {point.categoryAverages && (() => {
          const cats: Array<{ label: string; value: number | null }> = [
            { label: 'Goût', value: point.categoryAverages!.taste },
            { label: 'Mousse', value: point.categoryAverages!.foam },
            { label: 'Température', value: point.categoryAverages!.temperature },
            { label: 'Présentation', value: point.categoryAverages!.presentation },
            { label: 'Qualité/prix', value: point.categoryAverages!.valueForMoney },
          ].filter((c) => c.value != null)
          if (cats.length === 0) return null
          return (
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
              {cats.map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#7a6248', whiteSpace: 'nowrap' }}>{label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 28,
                      height: 18,
                      borderRadius: 5,
                      background: ratingColor(value!),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{value!.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export default function Map() {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
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
    });
    mapRef.current = map

    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
    })
    map.addControl(geolocate)

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
