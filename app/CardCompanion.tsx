"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type OwlState = "idle" | "hover" | "guide-start" | "success" | "error" | "loading";

type OwlStateEventDetail = {
  state: Exclude<OwlState, "hover" | "guide-start">;
  duration?: number;
};

export default function CardCompanion() {
  const [owlState, setOwlState] = useState<OwlState>("idle");
  const resetTimerRef = useRef<number | null>(null);

  const clearResetTimer = () => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  const showTemporaryState = (state: OwlState, duration = 1100) => {
    clearResetTimer();
    setOwlState(state);
    if (state !== "loading") {
      resetTimerRef.current = window.setTimeout(() => {
        setOwlState("idle");
        resetTimerRef.current = null;
      }, duration);
    }
  };

  useEffect(() => {
    const handleState = (event: Event) => {
      const detail = (event as CustomEvent<OwlStateEventDetail>).detail;
      if (!detail?.state) return;
      clearResetTimer();
      setOwlState(detail.state);
      if (detail.state !== "loading") {
        resetTimerRef.current = window.setTimeout(() => {
          setOwlState("idle");
          resetTimerRef.current = null;
        }, detail.duration ?? 1200);
      }
    };

    window.addEventListener("tcg-owl-state", handleState);
    return () => {
      window.removeEventListener("tcg-owl-state", handleState);
      clearResetTimer();
    };
  }, []);

  const openTour = () => {
    showTemporaryState("guide-start", 950);
    window.dispatchEvent(new CustomEvent("tcg-tour-open"));
  };

  const handlePointerEnter = () => {
    if (owlState === "idle") setOwlState("hover");
  };

  const handlePointerLeave = () => {
    if (owlState === "hover") setOwlState("idle");
  };

  return (
    <button
      type="button"
      className="card-companion card-companion-owl"
      data-owl-state={owlState}
      aria-label="Spustit krátkého průvodce webem TCG Ceny"
      onClick={openTour}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handlePointerEnter}
      onBlur={handlePointerLeave}
    >
      <span className="card-companion-figure owl-companion-figure" aria-hidden="true">
        <span className="owl-companion-parallax">
          <span className="owl-companion-flight">
            <span className="owl-companion-aura" />
            <span className="owl-companion-glint" />
            <span className="owl-companion-particle owl-companion-particle-one" />
            <span className="owl-companion-particle owl-companion-particle-two" />
            <span className="owl-companion-card-spark owl-companion-card-spark-left" />
            <span className="owl-companion-card-spark owl-companion-card-spark-right" />
            <Image
              className="owl-companion-image"
              src="/brand/tcg-ceny-owl-mascot-v1.webp"
              alt=""
              width="697"
              height="720"
              priority
              unoptimized
            />
            <span className="owl-companion-signal" />
          </span>
        </span>
      </span>

      <span className="card-companion-copy">
        <small><span aria-hidden="true" /> Nový tady?</small>
        <strong>Spustit průvodce</strong>
        <span className="card-companion-meta">
          6 krátkých zastávek · 45 s
          <span className="card-companion-arrow" aria-hidden="true">→</span>
        </span>
      </span>
    </button>
  );
}
