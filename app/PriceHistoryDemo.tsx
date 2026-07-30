"use client";

import { useState } from "react";

type Period = "7" | "30" | "90";

const invested = 7_200;

const periods: Record<Period, {
  dates: string[];
  labels: [string, string, string];
  values: number[];
}> = {
  "7": {
    dates: ["24. 7.", "25. 7.", "26. 7.", "27. 7.", "28. 7.", "29. 7.", "Dnes"],
    labels: ["24. 7.", "27. 7.", "Dnes"],
    values: [8_420, 8_475, 8_450, 8_520, 8_545, 8_570, 8_593],
  },
  "30": {
    dates: ["1. 7.", "6. 7.", "11. 7.", "16. 7.", "21. 7.", "26. 7.", "Dnes"],
    labels: ["1. 7.", "15. 7.", "Dnes"],
    values: [8_100, 8_180, 8_260, 8_230, 8_410, 8_510, 8_593],
  },
  "90": {
    dates: ["1. 5.", "16. 5.", "31. 5.", "15. 6.", "30. 6.", "15. 7.", "Dnes"],
    labels: ["1. 5.", "15. 6.", "Dnes"],
    values: [7_200, 7_480, 7_760, 7_650, 8_120, 8_360, 8_593],
  },
};

const formatPrice = (price: number) =>
  `${new Intl.NumberFormat("cs-CZ").format(price)} Kč`;

const formatChange = (change: number) =>
  `${change >= 0 ? "+" : "−"}${new Intl.NumberFormat("cs-CZ").format(Math.abs(change))} Kč`;

const formatPercent = (percent: number) =>
  `${percent >= 0 ? "+" : "−"}${new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(percent))} %`;

const chartPoints = (values: number[]) => {
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(maximum - minimum, 1);

  return values.map((value, index) => ({
    x: 10 + index * (580 / (values.length - 1)),
    y: 150 - ((value - minimum) / range) * 105,
  }));
};

const smoothPath = (points: Array<{ x: number; y: number }>) => {
  if (points.length < 2) return "";

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, `M ${points[0].x} ${points[0].y}`);
};

export default function PriceHistoryDemo() {
  const [period, setPeriod] = useState<Period>("90");
  const data = periods[period];
  const points = chartPoints(data.values);
  const linePath = smoothPath(points);
  const current = data.values[data.values.length - 1];
  const periodChange = current - data.values[0];
  const periodChangePercent = (periodChange / data.values[0]) * 100;
  const totalProfit = current - invested;
  const totalProfitPercent = (totalProfit / invested) * 100;

  return (
    <div className="chart-panel" aria-label="Ukázka vývoje hodnoty portfolia">
      <div className="chart-head">
        <div>
          <small>Ukázkové portfolio</small>
          <strong>Vývoj hodnoty sbírky</strong>
        </div>
        <div className="chart-ranges" aria-label="Období grafu">
          {(["7", "30", "90"] as Period[]).map((range) => (
            <button
              className={period === range ? "is-active" : ""}
              key={range}
              type="button"
              aria-pressed={period === range}
              onClick={() => setPeriod(range)}
            >
              {range} dní
            </button>
          ))}
        </div>
      </div>

      <div className="chart-value" aria-live="polite">
        <strong>{formatPrice(current)}</strong>
        <span>
          {formatChange(periodChange)} · {formatPercent(periodChangePercent)} za {period} dní
        </span>
      </div>

      <div className="chart-stats" aria-label="Souhrn ukázkového portfolia">
        <div><span>Investováno</span><strong>{formatPrice(invested)}</strong></div>
        <div><span>Aktuální hodnota</span><strong>{formatPrice(current)}</strong></div>
        <div>
          <span>Zisk / ztráta</span>
          <strong>{formatChange(totalProfit)} · {formatPercent(totalProfitPercent)}</strong>
        </div>
      </div>

      <div className="chart" key={period}>
        <div className="grid-lines" />
        <svg
          className="chart-line"
          viewBox="0 0 600 180"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Ilustrační vývoj hodnoty portfolia za ${period} dní`}
        >
          <defs>
            <linearGradient id={`chart-area-gradient-${period}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#43ce77" stopOpacity=".22" />
              <stop offset="100%" stopColor="#43ce77" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            className="chart-area"
            style={{ fill: `url(#chart-area-gradient-${period})` }}
            d={`${linePath} L 590 174 L 10 174 Z`}
          />
          <path className="chart-curve" d={linePath} />
          <g className="chart-points">
            {points.map((point, index) => (
              <circle key={data.dates[index]} cx={point.x} cy={point.y} r="3" />
            ))}
          </g>
        </svg>

        {points.map((point, index) => (
          <button
            className="chart-point-hit"
            key={data.dates[index]}
            type="button"
            style={{
              left: `${(point.x / 600) * 100}%`,
              top: `${(point.y / 180) * 100}%`,
            }}
            aria-label={`${data.dates[index]}: hodnota portfolia ${formatPrice(data.values[index])}`}
            data-tooltip={`${data.dates[index]} · ${formatPrice(data.values[index])}`}
          />
        ))}
      </div>

      <div className="chart-labels">
        {data.labels.map((label) => <span key={label}>{label}</span>)}
      </div>
      <p className="chart-context">
        Ilustrační ukázka. Hodnota portfolia vychází z evropských tržních dat
        jednotlivých produktů a může se průběžně měnit.
      </p>
    </div>
  );
}
