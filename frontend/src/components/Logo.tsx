type LogoProps = {
  className?: string
}

export default function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 600 200" className={className} role="img" aria-label="Adika Buyer">
      <defs>
        <linearGradient id="logo-pink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF75A0" />
          <stop offset="50%" stopColor="#FFA6C9" />
          <stop offset="100%" stopColor="#FF1493" />
        </linearGradient>
        <linearGradient id="logo-silver" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E0E0E0" />
          <stop offset="25%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#888888" />
          <stop offset="75%" stopColor="#E0E0E0" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      <path
        d="M 120 50 C 220 -30, 380 140, 480 70 C 580 0, 520 190, 420 160 C 320 130, 180 230, 80 130 C -20 30, 20 130, 120 50 Z"
        fill="url(#logo-pink)"
        opacity={0.9}
      />
      <path
        d="M 500 40 L 505 60 L 525 65 L 508 78 L 512 98 L 495 86 L 478 98 L 482 78 L 465 65 L 485 60 Z"
        fill="url(#logo-silver)"
      />
      <text
        x="300"
        y="135"
        textAnchor="middle"
        fontFamily="'Space Grotesk', sans-serif"
        fontWeight={700}
        fontSize={115}
        letterSpacing="-5"
        fill="#000000"
      >
        adika
      </text>
      <rect x="230" y="145" width="140" height="28" rx="14" fill="#000000" />
      <text
        x="300"
        y="164"
        textAnchor="middle"
        fontFamily="'Space Grotesk', sans-serif"
        fontWeight={600}
        fontSize={14}
        letterSpacing="6"
        fill="#FFFFFF"
      >
        BUYER
      </text>
    </svg>
  )
}
