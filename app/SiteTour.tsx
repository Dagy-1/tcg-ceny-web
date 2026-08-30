"use client";

import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const TOUR_QUERY = "pruvod";
const TOUR_DONE_KEY = "tcg-ceny-tour-v1";
const SEALED_OWL_POSES = ["search", "collection", "compare"];

const tourSteps = [
  {
    path: "/",
    owl: "welcome",
    eyebrow: "Rychlá prohlídka · 45 sekund",
    title: "Ahoj! Začínáš s Pokémony?",
    text: "Ukážeme ti, jak najít správný produkt, porovnat cenu a pohlídat naskladnění.",
  },
  {
    path: "/katalog/",
    owl: "search",
    eyebrow: "Katalog",
    title: "Najdi přesně svoje balení.",
    text: "ETB, booster box nebo kolekce — vyber produkt a hned uvidíš dostupné české nabídky.",
  },
  {
    path: "/zlevneni/",
    owl: "price-drop",
    eyebrow: "Zlevnění",
    title: "Skutečný pokles, ne planý poplach.",
    text: "Tady najdeš potvrzené poklesy cen s přímým odkazem na konkrétní obchod.",
  },
  {
    path: "/sledovani/",
    owl: "alert",
    eyebrow: "Sledování",
    title: "Řekni nám, co máme hlídat.",
    text: "Nastav si cílovou cenu nebo naskladnění. Přehled pak najdeš vždy na jednom místě.",
  },
  {
    path: "/portfolio/",
    owl: "collection",
    eyebrow: "Portfolio",
    title: "Sbírka bez tabulek.",
    text: "Ulož nákupní cenu a sleduj aktuální hodnotu i denní vývoj podle dostupných tržních dat.",
  },
  {
    path: "/porovnani/",
    owl: "compare",
    eyebrow: "Porovnání",
    title: "Co má dnes větší hodnotu?",
    text: "Postav proti sobě dva vlastní výběry produktů. Rozdíl uvidíš okamžitě — a tím je prohlídka hotová.",
  },
] as const;

function routeForStep(index: number) {
  return `${tourSteps[index].path}?${TOUR_QUERY}=${index + 1}`;
}

export default function SiteTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const startTour = useCallback(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setStep(0);
    setOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    window.localStorage.setItem(TOUR_DONE_KEY, "dismissed");
    const cleanUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState({}, "", cleanUrl);
    setOpen(false);
    window.setTimeout(() => previousFocusRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedStep = Number(params.get(TOUR_QUERY));
    let openTimer: number | undefined;

    if (Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= tourSteps.length) {
      openTimer = window.setTimeout(() => {
        previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setStep(requestedStep - 1);
        setOpen(true);
      }, 0);
    }

    window.addEventListener("tcg-tour-open", startTour);
    return () => {
      if (openTimer !== undefined) window.clearTimeout(openTimer);
      window.removeEventListener("tcg-tour-open", startTour);
    };
  }, [startTour]);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTour();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeTour, open]);

  const moveTo = (nextStep: number) => {
    window.location.assign(routeForStep(nextStep));
  };

  const finishTour = () => {
    window.localStorage.setItem(TOUR_DONE_KEY, "finished");
    const cleanUrl = `${window.location.pathname}${window.location.hash}`;
    window.history.replaceState({}, "", cleanUrl);
    setOpen(false);
  };

  if (!open) return null;

  const current = tourSteps[step];
  const owlVersion = SEALED_OWL_POSES.includes(current.owl) ? "v3-sealed-alpha" : "v2-alpha";
  const isFirst = step === 0;
  const isLast = step === tourSteps.length - 1;

  return (
    <div className="site-tour" role="dialog" aria-labelledby="site-tour-title">
      <section className="site-tour-panel">
        <div className="site-tour-mascot" aria-hidden="true" data-tour-owl={current.owl}>
          <Image
            key={current.owl}
            className="site-tour-owl"
            src={`/brand/tour/owl-${current.owl}-${owlVersion}.webp`}
            alt=""
            width={480}
            height={480}
            unoptimized
            loading="eager"
            draggable={false}
          />
        </div>

        <div className="site-tour-content">
          <div className="site-tour-topline">
            <p>{current.eyebrow}</p>
            <button ref={closeButtonRef} type="button" onClick={closeTour} aria-label="Zavřít průvodce">
              <X size={17} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
          <h2 id="site-tour-title">{current.title}</h2>
          <p className="site-tour-text">{current.text}</p>

          <div className="site-tour-footer">
            <div className="site-tour-progress" aria-label={`Krok ${step + 1} z ${tourSteps.length}`}>
              {tourSteps.map((item, index) => (
                <span className={index === step ? "is-current" : index < step ? "is-done" : ""} key={item.path} />
              ))}
              <small>{step + 1}/{tourSteps.length}</small>
            </div>
            <div className="site-tour-actions">
              {!isFirst && (
                <button className="site-tour-back" type="button" onClick={() => moveTo(step - 1)}>
                  <ArrowLeft size={16} aria-hidden="true" /> Zpět
                </button>
              )}
              <button
                className="site-tour-next"
                type="button"
                onClick={() => isLast ? finishTour() : moveTo(step + 1)}
              >
                {isLast ? <><Check size={17} aria-hidden="true" /> Hotovo</> : <>Pokračovat <ArrowRight size={17} aria-hidden="true" /></>}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
