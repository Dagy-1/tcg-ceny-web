export default function CardCompanion() {
  return (
    <aside
      className="card-companion"
      aria-label="Průvodce TCG Ceny: Ceny hlídám."
    >
      <span className="card-companion-figure" aria-hidden="true">
        <svg viewBox="0 0 220 220" role="presentation">
          <defs>
            <linearGradient id="companion-card-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#173150" />
              <stop offset=".52" stopColor="#0a1b31" />
              <stop offset="1" stopColor="#050e1d" />
            </linearGradient>
            <linearGradient id="companion-card-back-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#102743" />
              <stop offset="1" stopColor="#061324" />
            </linearGradient>
            <linearGradient id="companion-card-edge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fff0aa" />
              <stop offset=".42" stopColor="#e6b84a" />
              <stop offset="1" stopColor="#9b6010" />
            </linearGradient>
            <linearGradient id="companion-card-sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
              <stop offset=".5" stopColor="#fff3bd" stopOpacity=".42" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="companion-status-glow">
              <stop offset="0" stopColor="#7cffac" stopOpacity=".8" />
              <stop offset="1" stopColor="#36c66b" stopOpacity="0" />
            </radialGradient>
            <clipPath id="companion-front-clip">
              <rect x="3" y="3" width="96" height="142" rx="17" />
            </clipPath>
          </defs>

          <ellipse className="companion-halo" cx="108" cy="201" rx="78" ry="12" fill="#e6b84a" opacity=".13" />

          <g className="companion-card-back">
            <g transform="translate(103 18) rotate(7 48 71)">
              <rect x="3" y="3" width="96" height="142" rx="17" fill="url(#companion-card-back-fill)" stroke="#6b84a1" strokeWidth="2.2" />
              <path d="M19 28h47M19 37h33" stroke="#6b84a1" strokeWidth="3" strokeLinecap="round" opacity=".5" />
              <g className="companion-face companion-face-back">
                <path className="companion-eye" d="M27 78h7" stroke="#f5d77c" strokeWidth="4.2" strokeLinecap="round" />
                <path className="companion-eye companion-eye-right" d="M66 78h7" stroke="#f5d77c" strokeWidth="4.2" strokeLinecap="round" />
                <path d="M34 94c8 9 22 9 31 0" fill="none" stroke="#b9c8da" strokeWidth="3" strokeLinecap="round" />
              </g>
              <path d="M18 119h63M18 130h43" stroke="#24415f" strokeWidth="3" strokeLinecap="round" />
              <circle className="companion-status-aura" cx="78" cy="25" r="16" fill="url(#companion-status-glow)" />
              <circle className="companion-status" cx="78" cy="25" r="6" fill="#36c66b" />
            </g>
          </g>

          <g className="companion-card-front">
            <g transform="translate(28 65) rotate(-7 48 71)">
              <rect x="3" y="3" width="96" height="142" rx="17" fill="url(#companion-card-fill)" stroke="url(#companion-card-edge)" strokeWidth="3" />
              <path d="M18 28h48M18 38h32" stroke="#e6b84a" strokeWidth="3" strokeLinecap="round" opacity=".48" />
              <g className="companion-face">
                <path className="companion-eye" d="M27 78h7" stroke="#f5d77c" strokeWidth="4.2" strokeLinecap="round" />
                <path className="companion-eye companion-eye-right" d="M66 78h7" stroke="#f5d77c" strokeWidth="4.2" strokeLinecap="round" />
                <path d="M34 94c8 9 22 9 31 0" fill="none" stroke="#d6e1ef" strokeWidth="3" strokeLinecap="round" />
              </g>
              <path d="M18 119h63M18 130h43" stroke="#24415f" strokeWidth="3" strokeLinecap="round" />
              <path
                className="companion-card-sheen"
                d="M-42 -4h18l74 158H31z"
                fill="url(#companion-card-sheen)"
                clipPath="url(#companion-front-clip)"
              />
            </g>
          </g>

          <g className="companion-spark" fill="none" stroke="#f5d77c" strokeWidth="2.6" strokeLinecap="round">
            <path d="M202 42v12M196 48h12" />
            <path d="M187 27v7M183.5 30.5h7" opacity=".58" />
          </g>
        </svg>
      </span>

      <span className="card-companion-copy">
        <strong>Ceny hlídám.</strong>
      </span>
    </aside>
  );
}
