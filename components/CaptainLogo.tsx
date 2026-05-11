interface CaptainLogoProps {
  size?: number;
  accent?: string;
}

export function CaptainLogo({ size = 44, accent = "#006b3c" }: CaptainLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="stout-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#241404" />
          <stop offset="60%" stopColor="#0a0501" />
        </linearGradient>
        <linearGradient id="foam-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8e7" />
          <stop offset="100%" stopColor="#f0d878" />
        </linearGradient>
      </defs>
      <path
        d="M16 18 L48 18 L44 56 Q32 60 20 56 Z"
        fill="url(#stout-grad)"
        stroke="#130b02"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M16 18 Q20 12 24 14 Q28 9 32 13 Q36 9 40 14 Q44 12 48 18 Q44 22 32 22 Q20 22 16 18 Z"
        fill="url(#foam-grad)"
        stroke="#130b02"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M21 26 L23 50"
        stroke="rgba(255,220,160,0.35)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="48" cy="44" r="4.5" fill={accent} stroke="#130b02" strokeWidth="1.5" />
    </svg>
  );
}
