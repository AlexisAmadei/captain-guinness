'use client';
import { useRouter } from 'next/navigation';
import { FocusMapPointDetail } from '@/lib/map/events';

export type BarCardProps = {
  point: FocusMapPointDetail;
  onClose: () => void;
};

function tierGrad(avg: number): string {
  if (avg >= 4.0) return 'linear-gradient(135deg,#16a34a,#0f766e)';
  if (avg >= 3.0) return 'linear-gradient(135deg,#a16207,#c2410c)';
  if (avg >= 2.0) return 'linear-gradient(135deg,#c2410c,#dc2626)';
  return 'linear-gradient(135deg,#dc2626,#db2777)';
}

function StarRow({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.25 && value - full < 0.75;
  return (
    <span style={{ display: 'inline-flex', gap: 1.5, fontSize: 11 }}>
      {Array.from({ length: 5 }, (_, i) => {
        const pos = i + 1;
        const filled = pos <= full || (pos === full + 1 && half);
        return (
          <span key={i} style={{ color: filled ? '#d4880e' : '#c8c0b0', lineHeight: 1 }}>
            ★
          </span>
        );
      })}
    </span>
  );
}

function formatLastRatedAt(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(parsed);
}

export function BarCard({ point, onClose }: BarCardProps) {
  const router = useRouter();
  const date = formatLastRatedAt(point.lastRatedAt ?? null);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(4rem + env(safe-area-inset-bottom) + 0.75rem)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
        width: 'min(22rem, calc(100vw - 2rem))',
        background: '#fffaf3',
        borderRadius: 16,
        boxShadow: '0 24px 70px rgba(61,36,9,0.20)',
        border: '1px solid #e4d4bb',
        overflow: 'hidden',
        animation: 'barCardIn 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ padding: '14px 14px 14px' }}>
        {/* Top row: badge + info + close */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          {/* Gradient score badge */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: tierGrad(point.averageRating),
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"Geist Mono",ui-monospace,monospace',
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: -0.3,
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            {point.averageRating.toFixed(1)}
          </div>

          {/* Name + stars + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14.5,
                color: '#231608',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {point.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
              <StarRow value={point.averageRating} />
              <span
                style={{
                  fontSize: 11.5,
                  color: '#7a6248',
                  fontFamily: '"Geist Mono",ui-monospace,monospace',
                }}
              >
                {point.ratingCount === 1 ? '1 avis' : `${point.ratingCount} avis`}
              </span>
            </div>
            {date && (
              <div
                style={{
                  marginTop: 3,
                  fontSize: 11,
                  color: '#9c7d5c',
                  fontFamily: '"Geist Mono",ui-monospace,monospace',
                }}
              >
                dernière · {date}
              </div>
            )}
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              flexShrink: 0,
              width: 28,
              height: 28,
              borderRadius: 14,
              border: '1px solid #e4d4bb',
              background: '#fffaf3',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              lineHeight: 1,
              color: '#7a6248',
              marginTop: 2,
            }}
          >
            ×
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() =>
              router.push(`/pubs/${encodeURIComponent(point.placeId ?? point.id)}?name=${encodeURIComponent(point.name)}`)
            }
            style={{
              flex: 1,
              height: 34,
              borderRadius: 9,
              background: 'transparent',
              border: '1.5px solid #e4d4bb',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 500,
              color: '#231608',
              cursor: 'pointer',
            }}
          >
            Voir les avis
          </button>
          <button
            onClick={() =>
              router.push(
                `/rate${point.placeId ? `?placeId=${encodeURIComponent(point.placeId)}` : ''}`,
              )
            }
            style={{
              flex: 1,
              height: 34,
              borderRadius: 9,
              background: '#130b02',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 600,
              color: '#fdecc5',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15,23,42,0.20)',
            }}
          >
            + Noter
          </button>
        </div>
      </div>
    </div>
  );
}
