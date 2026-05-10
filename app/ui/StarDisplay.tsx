'use client';

export function StarDisplay({ value }: { value: number; }) {
  const full = Math.floor(value);
  const half = value - full >= 0.25 && value - full < 0.75;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= full) {
      stars.push(<span key={i} style={{ color: '#f59e0b' }}>★</span>);
    } else if (i === full + 1 && half) {
      stars.push(<span key={i} style={{ color: '#f59e0b' }}>½</span>);
    } else {
      stars.push(<span key={i} style={{ color: '#d1d5db' }}>★</span>);
    }
  }
  return <span style={{ fontSize: 16, letterSpacing: 1 }}>{stars}</span>;
}
