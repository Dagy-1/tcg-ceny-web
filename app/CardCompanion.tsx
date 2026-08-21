export default function CardCompanion() {
  return (
    <aside
      className="card-companion"
      aria-label="Průvodce TCG Ceny: Ceny hlídám za tebe."
    >
      <span className="card-companion-figure" aria-hidden="true">
        <svg viewBox="0 0 112 112" role="presentation">
          <defs>
            <linearGradient id="companion-card-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#132640" />
              <stop offset="1" stopColor="#071222" />
            </linearGradient>
            <linearGradient id="companion-card-edge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f5d77c" />
              <stop offset="1" stopColor="#b77a18" />
            </linearGradient>
          </defs>

          <g className="companion-card-back" transform="translate(13 13) rotate(-9 42 43)">
            <rect x="8" y="7" width="66" height="84" rx="10" fill="#09182b" stroke="#55708f" strokeWidth="2" />
            <path d="M20 21h31M20 28h22" stroke="#55708f" strokeWidth="2" strokeLinecap="round" opacity=".55" />
          </g>

          <g className="companion-card-front" transform="translate(28 8) rotate(5 35 45)">
            <rect x="4" y="4" width="70" height="90" rx="11" fill="url(#companion-card-fill)" stroke="url(#companion-card-edge)" strokeWidth="2.4" />
            <path d="M14 20h29" stroke="#e6b84a" strokeWidth="2" strokeLinecap="round" opacity=".4" />
            <path d="M14 26h19" stroke="#e6b84a" strokeWidth="2" strokeLinecap="round" opacity=".24" />
            <g className="companion-face">
              <path className="companion-eye" d="M22 50h5" stroke="#f5d77c" strokeWidth="3" strokeLinecap="round" />
              <path className="companion-eye companion-eye-right" d="M49 50h5" stroke="#f5d77c" strokeWidth="3" strokeLinecap="round" />
              <path d="M27 63c6 6 15 6 22 0" fill="none" stroke="#b9c8da" strokeWidth="2.4" strokeLinecap="round" />
            </g>
            <path d="M13 78h52" stroke="#24415f" strokeWidth="2" strokeLinecap="round" />
            <path d="M13 84h34" stroke="#24415f" strokeWidth="2" strokeLinecap="round" />
            <circle className="companion-status" cx="62" cy="18" r="4" fill="#36c66b" />
          </g>

          <g className="companion-spark" fill="none" stroke="#f5d77c" strokeWidth="2" strokeLinecap="round">
            <path d="M94 25v8M90 29h8" />
            <path d="M86 16v4M84 18h4" opacity=".55" />
          </g>
        </svg>
      </span>

      <span className="card-companion-copy">
        <strong>Ceny hlídám<br />za tebe.</strong>
      </span>
    </aside>
  );
}
