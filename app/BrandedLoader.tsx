"use client";

import { useEffect, useState } from "react";

type BrandedLoaderProps = {
  label: string;
  detail: string;
  longLabel?: string;
  longDetail?: string;
  delayMs?: number;
  longDelayMs?: number;
  className?: string;
  compact?: boolean;
};

export default function BrandedLoader({
  label,
  detail,
  longLabel = "Ještě chvilku…",
  longDetail = "Spojení se probouzí. Tvoje data zůstávají v bezpečí.",
  delayMs = 320,
  longDelayMs = 6_500,
  className = "",
  compact = false,
}: BrandedLoaderProps) {
  const [visible, setVisible] = useState(delayMs <= 0);
  const [takingLonger, setTakingLonger] = useState(false);

  useEffect(() => {
    const showTimer = window.setTimeout(() => setVisible(true), Math.max(0, delayMs));
    const longTimer = window.setTimeout(
      () => {
        setVisible(true);
        setTakingLonger(true);
      },
      Math.max(delayMs, longDelayMs),
    );

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(longTimer);
    };
  }, [delayMs, longDelayMs]);

  const currentLabel = takingLonger ? longLabel : label;
  const currentDetail = takingLonger ? longDetail : detail;

  return (
    <div
      className={`tcg-loading-panel${visible ? " is-visible" : ""}${takingLonger ? " is-taking-longer" : ""}${compact ? " is-compact" : ""}${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-hidden={!visible}
    >
      <span className="tcg-loading-visual" aria-hidden="true">
        <span className="tcg-loading-halo" />
        <span className="tcg-loading-card is-back"><i /><i /></span>
        <span className="tcg-loading-card is-front"><i /><i /><b /></span>
        <span className="tcg-loading-signal" />
      </span>
      <span className="tcg-loading-copy">
        <strong>{currentLabel}</strong>
        <small>{currentDetail}</small>
      </span>
    </div>
  );
}
