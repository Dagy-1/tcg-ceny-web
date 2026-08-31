import { ArrowDown, ArrowRight, ArrowUp, Bell, Check } from "lucide-react";
import { priceSummary } from "./price-summary";
import "./price-summary.css";

const money = (value: number) => `${new Intl.NumberFormat("cs-CZ").format(value)} Kč`;

type Props = {
  price: number | null;
  threshold: number | null;
  stale?: boolean;
  // Only provide a comparable historical observation, never infer it from a target or an alert.
  history?: { price: number; label: string; period: string };
};

export default function WatchingPriceSummary({ price, threshold, stale = false, history }: Props) {
  const values = priceSummary(price, threshold, stale, history?.price ?? null);
  const hasHistory = values.previous !== null && history;
  const falling = values.difference !== null && values.difference < 0;
  const rising = values.difference !== null && values.difference > 0;
  const ChangeIcon = falling ? ArrowDown : rising ? ArrowUp : ArrowRight;
  return (
    <div className="watching-price-summary">
      <div className="watching-price-movement">
        {hasHistory && <>
          <div className="watching-price-before"><span>{history.label}</span><strong>{money(values.previous!)}</strong></div>
          <ArrowRight className="watching-price-arrow" size={20} aria-hidden="true" />
        </>}
        <div className="watching-price-now"><span>{stale ? "Poslední dostupná cena" : hasHistory ? "Nyní" : "Aktuální cena"}</span><strong>{values.current === null ? "Není dostupná" : money(values.current)}</strong></div>
        {hasHistory && values.difference !== null && <div className={`watching-price-change${falling ? " is-down" : rising ? " is-up" : ""}`}>
          <strong><ChangeIcon size={17} aria-hidden="true" />{falling ? "−" : rising ? "+" : ""}{money(Math.abs(values.difference))} ({falling ? "−" : rising ? "+" : ""}{values.percent} %)</strong>
          <span>{history.period}</span>
        </div>}
        {!hasHistory && <p className="watching-price-history-note">{stale ? "Čekáme na nové ověření ceny." : "Srovnání s cenou před 7 dny zatím není dostupné."}</p>}
      </div>
      <div className={`watching-price-target${values.reached ? " is-reached" : ""}`}>
        {values.reached ? <Check size={22} aria-hidden="true" /> : <Bell size={22} aria-hidden="true" />}
        <div><span>Tvůj cenový limit</span><strong>{values.limit === null ? "Nenastaven" : money(values.limit)}</strong></div>
        <p>{values.limit === null ? "Hlídáš naskladnění bez cenového limitu." : values.gap === null ? "Vzdálenost do limitu ověříme s aktuální cenou." : values.reached ? <><strong>Cena je v limitu.</strong> Aktuální nabídku ověř v detailu produktu.</> : <>Do limitu zbývá <strong>pokles o {money(values.gap)}.</strong></>}</p>
      </div>
    </div>
  );
}
