'use client';
import { FocusMapPointDetail } from '@/lib/map/events';
import { ratingColor } from './mapbox';
import { StarDisplay } from './StarDisplay';

export type BarCardProps = {
  point: FocusMapPointDetail
  onClose: () => void
}

export function BarCard({ point, onClose }: BarCardProps) {
  const color = ratingColor(point.averageRating);
  console.log('Rendering BarCard for', point);

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
          const cats: Array<{ label: string; value: number | null; }> = [
            { label: 'Goût', value: point.categoryAverages!.taste },
            { label: 'Mousse', value: point.categoryAverages!.foam },
            { label: 'Température', value: point.categoryAverages!.temperature },
            { label: 'Présentation', value: point.categoryAverages!.presentation },
            { label: 'Qualité/prix', value: point.categoryAverages!.valueForMoney },
          ].filter((c) => c.value != null);
          if (cats.length === 0) return null;
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
          );
        })()}
      </div>
    </div>
  );
}
