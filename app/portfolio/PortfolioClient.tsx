"use client";

import Link from "next/link";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import AuthMenu from "../AuthMenu";

type Product = {
  id: string;
  name: string;
  type: string;
  era: string;
  set: string;
  image: string;
  marketPrice: number | null;
  priceUpdatedAt: string;
};

type SessionUser = {
  id: string;
  username: string;
  avatar: string | null;
};

type PortfolioItem = {
  id: number | string;
  productId: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
  note: string;
  product: Product;
};

type HistoryPeriod = 7 | 30 | 90;

type PortfolioHistoryPoint = {
  date: string;
  invested: number;
  marketValue: number;
  profit: number;
};

type PortfolioHistory = {
  days: number;
  points: PortfolioHistoryPoint[];
  firstDate: string | null;
  latestDate: string | null;
};

type LoadState = "loading" | "signed-out" | "signed-in";

const formatCzk = (value: number) =>
  `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(value)} Kč`;

const formatPercent = (value: number) =>
  `${value > 0 ? "+" : ""}${new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits: 1,
  }).format(value)} %`;

const today = () => new Date().toISOString().slice(0, 10);

function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  if (!product.image || failed) {
    return <span className="portfolio-image-fallback">TCG</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={product.image} alt="" onError={() => setFailed(true)} />
  );
}

function DiscordMark() {
  return <span className="discord-mark" aria-hidden="true">D</span>;
}

function GoogleMark() {
  return <span className="google-mark" aria-hidden="true">G</span>;
}

function AddItemDialog({
  products,
  initialProductId,
  onClose,
  onCreated,
}: {
  products: Product[];
  initialProductId: string | null;
  onClose: () => void;
  onCreated: (item: PortfolioItem) => void;
}) {
  const initialProduct = initialProductId
    ? products.find((product) => product.id === initialProductId) ?? null
    : null;
  const [query, setQuery] = useState(initialProduct?.name ?? "");
  const [productId, setProductId] = useState(initialProduct?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [buyPriceInput, setBuyPriceInput] = useState(
    String(initialProduct?.marketPrice ?? 0),
  );
  const [buyDate, setBuyDate] = useState(today());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("cs");
    if (!needle) return products.slice(0, 8);
    return products
      .filter((product) =>
        `${product.name} ${product.set} ${product.type}`.toLocaleLowerCase("cs").includes(needle),
      )
      .slice(0, 8);
  }, [products, query]);
  const selected = products.find((product) => product.id === productId) ?? null;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const selectProduct = (product: Product) => {
    setProductId(product.id);
    setQuery(product.name);
    if (product.marketPrice !== null) setBuyPriceInput(String(product.marketPrice));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const buyPrice = Number(buyPriceInput);
      if (!Number.isInteger(buyPrice) || buyPrice < 0 || buyPrice > 10_000_000) {
        throw new Error("Zadej platnou nákupní cenu.");
      }
      const response = await fetch("/api/portfolio", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity, buyPrice, buyDate, note }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Položku se nepodařilo uložit.");
      if (!selected) throw new Error("Vyber produkt z investiční databáze.");
      onCreated({
        id: result.id,
        productId,
        quantity,
        buyPrice,
        buyDate,
        note,
        product: selected,
      });
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Položku se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="portfolio-modal-layer" onMouseDown={onClose}>
      <section
        className="portfolio-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolio-add-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="portfolio-modal-close" type="button" onClick={onClose} aria-label="Zavřít">
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>
        <p className="portfolio-kicker">Nová položka</p>
        <h2 id="portfolio-add-title">Přidat produkt do portfolia</h2>
        <p className="portfolio-modal-intro">
          Vyber produkt z portfolio databáze a doplň údaje ze svého nákupu.
        </p>

        <form onSubmit={submit}>
          <label className="portfolio-product-search">
            <span>Produkt</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setProductId("");
              }}
              placeholder="Začni psát název produktu"
              autoFocus
            />
          </label>
          {!selected && (
            <div className="portfolio-search-results">
              {matches.map((product) => (
                <button type="button" key={product.id} onClick={() => selectProduct(product)}>
                  <span><ProductImage product={product} /></span>
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.set} · {product.type}</small>
                  </span>
                  <b>{product.marketPrice === null ? "Bez ceny" : formatCzk(product.marketPrice)}</b>
                </button>
              ))}
            </div>
          )}
          {selected && (
            <div className="portfolio-selected-product">
              <span><ProductImage product={selected} /></span>
              <div>
                <strong>{selected.name}</strong>
                <small>{selected.set} · {selected.type}</small>
              </div>
              <button type="button" onClick={() => setProductId("")}>Změnit</button>
            </div>
          )}

          <div className="portfolio-form-grid">
            <label>
              <span>Počet kusů</span>
              <input
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                required
              />
            </label>
            <label>
              <span>Nákupní cena za kus</span>
              <div className="portfolio-price-input">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={buyPriceInput}
                  onChange={(event) => {
                    if (/^\d*$/.test(event.target.value)) {
                      setBuyPriceInput(event.target.value);
                    }
                  }}
                  required
                />
                <b>Kč</b>
              </div>
            </label>
            <label>
              <span>Datum nákupu</span>
              <input
                type="date"
                value={buyDate}
                max={today()}
                onChange={(event) => setBuyDate(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Poznámka <small>volitelné</small></span>
              <input
                value={note}
                maxLength={250}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Např. stav obalu"
              />
            </label>
          </div>
          {error && <p className="portfolio-form-error" role="alert">{error}</p>}
          <div className="portfolio-form-actions">
            <button type="button" className="portfolio-button-secondary" onClick={onClose}>Zrušit</button>
            <button type="submit" className="portfolio-button-primary" disabled={!selected || saving}>
              <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
              {saving ? "Ukládám…" : "Přidat do portfolia"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function EditItemDialog({
  item,
  onClose,
  onUpdated,
}: {
  item: PortfolioItem;
  onClose: () => void;
  onUpdated: (item: PortfolioItem) => void;
}) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [buyPriceInput, setBuyPriceInput] = useState(String(item.buyPrice));
  const [buyDate, setBuyDate] = useState(item.buyDate);
  const [note, setNote] = useState(item.note);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const buyPrice = Number(buyPriceInput);
      if (!Number.isInteger(buyPrice) || buyPrice < 0 || buyPrice > 10_000_000) {
        throw new Error("Zadej platnou nákupní cenu.");
      }
      const response = await fetch(`/api/portfolio/${item.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, buyPrice, buyDate, note }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Změny se nepodařilo uložit.");
      onUpdated({ ...item, quantity, buyPrice, buyDate, note: note.trim() });
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Změny se nepodařilo uložit.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="portfolio-modal-layer" onMouseDown={onClose}>
      <section
        className="portfolio-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portfolio-edit-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="portfolio-modal-close" type="button" onClick={onClose} aria-label="Zavřít">
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>
        <p className="portfolio-kicker">Úprava položky</p>
        <h2 id="portfolio-edit-title">Upravit produkt</h2>
        <p className="portfolio-modal-intro">
          Uprav údaje o svém nákupu. Produkt zůstane uložený v portfoliu.
        </p>

        <div className="portfolio-selected-product">
          <span><ProductImage product={item.product} /></span>
          <div>
            <strong>{item.product.name}</strong>
            <small>{item.product.set} · {item.product.type}</small>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="portfolio-form-grid">
            <label>
              <span>Počet kusů</span>
              <input
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                required
                autoFocus
              />
            </label>
            <label>
              <span>Nákupní cena za kus</span>
              <div className="portfolio-price-input">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={buyPriceInput}
                  onChange={(event) => {
                    if (/^\d*$/.test(event.target.value)) {
                      setBuyPriceInput(event.target.value);
                    }
                  }}
                  required
                />
                <b>Kč</b>
              </div>
            </label>
            <label>
              <span>Datum nákupu</span>
              <input
                type="date"
                value={buyDate}
                max={today()}
                onChange={(event) => setBuyDate(event.target.value)}
                required
              />
            </label>
            <label>
              <span>Poznámka <small>volitelné</small></span>
              <input
                value={note}
                maxLength={250}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Např. stav obalu"
              />
            </label>
          </div>
          {error && <p className="portfolio-form-error" role="alert">{error}</p>}
          <div className="portfolio-form-actions">
            <button type="button" className="portfolio-button-secondary" onClick={onClose}>
              Zrušit
            </button>
            <button type="submit" className="portfolio-button-primary" disabled={saving}>
              {saving ? "Ukládám…" : "Uložit změny"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function SignedOutPreview({
  products,
  discordHref,
  googleHref,
}: {
  products: Product[];
  discordHref: string;
  googleHref: string;
}) {
  const examples = products
    .filter((product) =>
      product.marketPrice !== null &&
      product.marketPrice < 100_000 &&
      (product.era.includes("Mega Evolution") || product.era.includes("Scarlet")),
    )
    .slice(0, 4);
  const current = examples.reduce((sum, product) => sum + (product.marketPrice ?? 0), 0);
  const invested = Math.round(current * 0.86);
  return (
    <>
      <section className="portfolio-signin">
        <div>
          <p className="portfolio-kicker">Soukromé a synchronizované</p>
          <h2>Tvoje sbírka. Jedno místo.</h2>
          <p>
            Přihlas se přes Discord nebo Google a portfolio se bezpečně spojí s tvým účtem.
            Žádná další registrace ani nové heslo.
          </p>
          <div className="portfolio-auth-options">
            <a className="portfolio-provider-button discord" href={discordHref}>
              <DiscordMark /> Přihlásit přes Discord
            </a>
            <a className="portfolio-provider-button google" href={googleHref}>
              <GoogleMark /> Přihlásit přes Google
            </a>
          </div>
          <small>Hesla od Discordu ani Googlu a platební údaje nikdy neukládáme.</small>
        </div>
        <div className="portfolio-security">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Každý vidí pouze svoje portfolio</strong>
            <p>Přístup je svázaný s ověřeným účtem a chráněnou relací.</p>
          </div>
        </div>
      </section>

      <section className="portfolio-preview" aria-label="Ukázka portfolia">
        <div className="portfolio-preview-heading">
          <div>
            <p className="portfolio-kicker">Ukázkový přehled</p>
            <h2>Takto bude portfolio vypadat</h2>
          </div>
          <span>DEMO</span>
        </div>
        <div className="portfolio-metrics">
          <article><span>Investováno</span><strong>{formatCzk(invested)}</strong><small>nákupní hodnota</small></article>
          <article><span>Aktuální hodnota</span><strong>{formatCzk(current)}</strong><small>podle trhu</small></article>
          <article className="is-positive"><span>Zisk / ztráta</span><strong>+{formatCzk(current - invested)}</strong><small>{formatPercent(((current - invested) / invested) * 100)}</small></article>
          <article><span>Produktů</span><strong>{examples.length}</strong><small>{examples.length} kusy</small></article>
        </div>
        <div className="portfolio-preview-products">
          {examples.map((product, index) => (
            <article key={product.id}>
              <div className="portfolio-product-image"><ProductImage product={product} /></div>
              <div>
                <span>{product.set}</span>
                <h3>{product.name}</h3>
                <p>1 ks · nákup {formatCzk(Math.round((product.marketPrice ?? 0) * (0.8 + index * 0.03)))}</p>
              </div>
              <div className="portfolio-product-value">
                <strong>{formatCzk(product.marketPrice ?? 0)}</strong>
                <span className="is-positive">+{4 + index * 3},2 %</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function smoothChartPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const after = points[index + 2] ?? next;
    path += ` C ${current.x + (next.x - previous.x) / 6} ${current.y + (next.y - previous.y) / 6}`;
    path += ` ${next.x - (after.x - current.x) / 6} ${next.y - (after.y - current.y) / 6}`;
    path += ` ${next.x} ${next.y}`;
  }
  return path;
}

function PortfolioHistoryChart({
  history,
  period,
  loading,
  onPeriodChange,
}: {
  history: PortfolioHistory | null;
  period: HistoryPeriod;
  loading: boolean;
  onPeriodChange: (period: HistoryPeriod) => void;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const points = history?.points ?? [];
  const width = 760;
  const height = 280;
  const plot = { left: 30, right: 18, top: 22, bottom: 45 };
  const bottom = height - plot.bottom;
  const plotWidth = width - plot.left - plot.right;
  const values = points.flatMap((point) => [point.invested, point.marketValue]);
  const rawMinimum = values.length ? Math.min(...values) : 0;
  const rawMaximum = values.length ? Math.max(...values) : 1;
  const padding = Math.max((rawMaximum - rawMinimum) * 0.16, rawMaximum * 0.035, 100);
  const minimum = Math.max(0, rawMinimum - padding);
  const maximum = Math.max(rawMaximum + padding, minimum + 1);
  const xFor = (index: number) => (
    points.length === 1
      ? plot.left + plotWidth / 2
      : plot.left + (index / Math.max(points.length - 1, 1)) * plotWidth
  );
  const yFor = (value: number) => plot.top + ((maximum - value) / (maximum - minimum)) * (bottom - plot.top);
  const marketPoints = points.map((point, index) => ({ x: xFor(index), y: yFor(point.marketValue) }));
  const investedPoints = points.map((point, index) => ({ x: xFor(index), y: yFor(point.invested) }));
  const marketPath = smoothChartPath(marketPoints);
  const investedPath = smoothChartPath(investedPoints);
  const areaPath = marketPoints.length > 1
    ? `${marketPath} L ${marketPoints.at(-1)?.x} ${bottom} L ${marketPoints[0].x} ${bottom} Z`
    : "";
  const latest = points.at(-1) ?? null;
  const first = points[0] ?? null;
  const change = latest && first ? latest.marketValue - first.marketValue : 0;
  const changePercent = first?.marketValue ? (change / first.marketValue) * 100 : 0;
  const currentProfit = latest?.profit ?? 0;
  const currentProfitPercent = latest?.invested ? (currentProfit / latest.invested) * 100 : 0;
  const effectiveActiveIndex = activeIndex === null
    ? Math.max(points.length - 1, 0)
    : Math.min(activeIndex, Math.max(points.length - 1, 0));
  const active = points[effectiveActiveIndex] ?? null;
  const activeX = points.length > 1
    ? Math.max(10, Math.min(90, (effectiveActiveIndex / (points.length - 1)) * 100))
    : 50;
  const formatDate = (value: string) => new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));

  const selectNearestPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    if (points.length < 2) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const relative = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    setActiveIndex(Math.round(relative * (points.length - 1)));
  };

  return (
    <section className="portfolio-history" aria-label="Vývoj hodnoty portfolia">
      <div className="portfolio-history-header">
        <div>
          <p className="portfolio-kicker">Historie portfolia</p>
          <h2>Vývoj hodnoty sbírky</h2>
          <p className="portfolio-history-description">
            Tržní hodnota v čase, porovnaná s částkou, kterou jsi skutečně investoval.
          </p>
        </div>
        <div className="portfolio-history-periods" aria-label="Období grafu">
          {([7, 30, 90] as HistoryPeriod[]).map((value) => (
            <button
              key={value}
              type="button"
              className={period === value ? "is-active" : ""}
              onClick={() => {
                setActiveIndex(null);
                onPeriodChange(value);
              }}
              aria-pressed={period === value}
            >
              {value} dní
            </button>
          ))}
        </div>
      </div>

      {loading && !history ? (
        <div className="portfolio-history-loading"><span /> Načítám skutečný vývoj sbírky…</div>
      ) : points.length ? (
        <>
          <div className="portfolio-history-summary">
            <div>
              <span>Aktuální hodnota</span>
              <strong>{formatCzk(latest?.marketValue ?? 0)}</strong>
            </div>
            <div>
              <span>Investováno</span>
              <strong>{formatCzk(latest?.invested ?? 0)}</strong>
            </div>
            <div className={currentProfit > 0 ? "is-positive" : currentProfit < 0 ? "is-negative" : "is-neutral"}>
              <span>Aktuální zisk / ztráta</span>
              <strong>{currentProfit > 0 ? "+" : ""}{formatCzk(currentProfit)}</strong>
              <small>{formatPercent(currentProfitPercent)}</small>
            </div>
            <div className={change > 0 ? "is-positive" : change < 0 ? "is-negative" : "is-neutral"}>
              <span>{points.length > 1 ? `Pohyb hodnoty od ${formatDate(points[0].date)}` : "První záznam historie"}</span>
              <strong>
                {points.length > 1
                  ? `${change > 0 ? "+" : ""}${formatCzk(change)}`
                  : "Data se začala sbírat"}
              </strong>
              {points.length > 1 && <small>{formatPercent(changePercent)}</small>}
            </div>
          </div>

          {points.length > 1 ? (
            <>
          <div className="portfolio-history-visual">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`Tržní hodnota portfolia za posledních ${period} dní`}
              onPointerMove={selectNearestPoint}
              onPointerDown={selectNearestPoint}
            >
              {[0, 1, 2, 3].map((line) => {
                const y = plot.top + (line / 3) * (bottom - plot.top);
                return <line key={line} className="portfolio-chart-grid" x1={plot.left} y1={y} x2={width - plot.right} y2={y} />;
              })}
              {areaPath && <path className="portfolio-chart-area" d={areaPath} />}
              {investedPath && <path className="portfolio-chart-invested" d={investedPath} />}
              {marketPath && <path className="portfolio-chart-market" d={marketPath} />}
              {marketPoints.map((point, index) => (
                <circle
                  key={points[index].date}
                  className={index === effectiveActiveIndex ? "portfolio-chart-dot is-active" : "portfolio-chart-dot"}
                  cx={point.x}
                  cy={point.y}
                  r={index === effectiveActiveIndex ? 5 : 3.5}
                />
              ))}
              {active && (
                <line
                  className="portfolio-chart-cursor"
                  x1={xFor(effectiveActiveIndex)}
                  y1={plot.top}
                  x2={xFor(effectiveActiveIndex)}
                  y2={bottom}
                />
              )}
              <text className="portfolio-chart-date" x={plot.left} y={height - 13}>{formatDate(points[0].date)}</text>
              <text className="portfolio-chart-date" x={width - plot.right} y={height - 13} textAnchor="end">
                {formatDate(points.at(-1)?.date ?? points[0].date)}
              </text>
            </svg>
            {active && (
              <div className="portfolio-chart-tooltip" style={{ left: `${activeX}%` }}>
                <span>{formatDate(active.date)}</span>
                <strong>{formatCzk(active.marketValue)}</strong>
                <small>Investováno {formatCzk(active.invested)}</small>
                <em className={active.profit > 0 ? "is-positive" : active.profit < 0 ? "is-negative" : "is-neutral"}>
                  Zisk / ztráta {active.profit > 0 ? "+" : ""}{formatCzk(active.profit)}
                  {" · "}{formatPercent(active.invested ? (active.profit / active.invested) * 100 : 0)}
                </em>
              </div>
            )}
          </div>

          <div className="portfolio-history-legend">
            <span className="market">Tržní hodnota sbírky</span>
            <span className="invested">Celkem investováno</span>
            <small>{`Skutečné denní záznamy od ${formatDate(points[0].date)}.`}</small>
          </div>
            </>
          ) : (
            <div className="portfolio-history-first-record">
              <div className="portfolio-history-first-marker" aria-hidden="true"><span /></div>
              <div>
                <span>Start historie · {formatDate(points[0].date)}</span>
                <strong>První bod je bezpečně uložený</strong>
                <p>
                  Odteď budeme průběžně zaznamenávat skutečnou hodnotu sbírky.
                  Jakmile přibude další denní ocenění, zobrazí se zde vývojová křivka.
                </p>
              </div>
              <small>1 skutečný záznam</small>
            </div>
          )}
        </>
      ) : (
        <div className="portfolio-history-empty">
          <strong>Historii začneme sbírat dnes.</strong>
          <p>Graf se zobrazí, jakmile bude mít portfolio dostupné tržní ocenění.</p>
        </div>
      )}
    </section>
  );
}

export default function PortfolioClient({
  products,
  productCount,
  sourceUpdatedAt,
}: {
  products: Product[];
  productCount: number;
  sourceUpdatedAt: string;
}) {
  const [state, setState] = useState<LoadState>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [initialProductId, setInitialProductId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod>(90);
  const [history, setHistory] = useState<PortfolioHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async (period: HistoryPeriod) => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/portfolio/history?days=${period}`, {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("History unavailable");
      setHistory(await response.json() as PortfolioHistory);
    } catch {
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const add = params.get("add");
    if (add) queueMicrotask(() => setInitialProductId(add));

    fetch("/api/session", {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) return { user: null };
        return response.json();
      })
      .then(async (sessionData: { user: SessionUser | null }) => {
        setUser(sessionData.user);
        if (!sessionData.user) {
          setState("signed-out");
          return;
        }
        const response = await fetch("/api/portfolio", {
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error();
        const portfolio = await response.json() as { items: PortfolioItem[] };
        setItems(portfolio.items);
        setState("signed-in");
        if (portfolio.items.length) void loadHistory(90);
        if (add) setAdding(true);
      })
      .catch(() => setState("signed-out"));
  }, [loadHistory]);

  const totals = useMemo(() => {
    const invested = items.reduce((sum, item) => sum + item.buyPrice * item.quantity, 0);
    const current = items.reduce(
      (sum, item) => sum + (item.product.marketPrice ?? item.buyPrice) * item.quantity,
      0,
    );
    const pieces = items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      invested,
      current,
      profit: current - invested,
      roi: invested ? ((current - invested) / invested) * 100 : 0,
      pieces,
    };
  }, [items]);
  const returnTo = initialProductId
    ? `/portfolio/?add=${encodeURIComponent(initialProductId)}`
    : "/portfolio/";
  const discordHref = `/api/auth/discord?return_to=${encodeURIComponent(returnTo)}`;
  const googleHref = `/api/auth/google?return_to=${encodeURIComponent(returnTo)}`;

  const changeHistoryPeriod = (period: HistoryPeriod) => {
    setHistoryPeriod(period);
    if (state === "signed-in" && items.length) void loadHistory(period);
  };

  const removeItem = async (item: PortfolioItem) => {
    if (!window.confirm(`Odebrat ${item.product.name} z portfolia?`)) return;
    const response = await fetch(`/api/portfolio/${item.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (response.ok) {
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      void loadHistory(historyPeriod);
      setNotice("Položka byla odebrána.");
    } else {
      setNotice("Položku se nepodařilo odebrat.");
    }
  };

  return (
    <main className="portfolio-page">
      <nav className="nav portfolio-nav" aria-label="Hlavní navigace">
        <Link className="brand" href="/" aria-label="TCG Ceny – úvod">
          <span className="brand-mark" aria-hidden="true"><span /><span /></span>
          <span>TCG <strong>Ceny</strong></span>
        </Link>
        <div className="nav-links">
          <Link href="/">Domů</Link>
          <Link href="/katalog/">Katalog</Link>
          <Link className="portfolio-nav-active" href="/portfolio/">Portfolio</Link>
          <Link href="/pro-eshopy/">Pro e-shopy</Link>
        </div>
        <AuthMenu />
      </nav>

      <header className="portfolio-header">
        <div>
          <p className="portfolio-eyebrow"><span /> TCG Ceny Portfolio</p>
          <h1>Hodnota tvé sbírky.<span>Bez tabulek a dohadů.</span></h1>
          <p>
            Ulož své sealed produkty a sleduj nákupní cenu, aktuální hodnotu i vývoj portfolia
            podle specializovaných investičních dat.
          </p>
        </div>
        <div className="portfolio-header-proof">
          <span>{new Intl.NumberFormat("cs-CZ").format(productCount)}</span>
          <p>sealed produktů v portfolio databázi</p>
          <small>Tržní data obnovena {sourceUpdatedAt.slice(0, 10).split("-").reverse().join(". ")}</small>
        </div>
      </header>

      {state === "signed-out" && (
        <SignedOutPreview
          products={products}
          discordHref={discordHref}
          googleHref={googleHref}
        />
      )}

      {state === "signed-in" && (
        <section className="portfolio-dashboard">
          <div className="portfolio-dashboard-heading">
            <div>
              <p className="portfolio-kicker">Osobní přehled</p>
              <h2>Moje portfolio</h2>
              <p>{user?.username}, tady máš hodnotu své sbírky na jednom místě.</p>
            </div>
            <button className="portfolio-button-primary" type="button" onClick={() => setAdding(true)}>
              <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
              Přidat produkt
            </button>
          </div>

          <div className="portfolio-metrics">
            <article><span>Investováno</span><strong>{formatCzk(totals.invested)}</strong><small>součet nákupů</small></article>
            <article><span>Aktuální hodnota</span><strong>{formatCzk(totals.current)}</strong><small>podle posledních cen</small></article>
            <article className={totals.profit >= 0 ? "is-positive" : "is-negative"}>
              <span>Zisk / ztráta</span>
              <strong>{totals.profit > 0 ? "+" : ""}{formatCzk(totals.profit)}</strong>
              <small>{formatPercent(totals.roi)}</small>
            </article>
            <article><span>Produkty</span><strong>{items.length}</strong><small>{totals.pieces} ks celkem</small></article>
          </div>

          {items.length > 0 && (
            <PortfolioHistoryChart
              history={history}
              period={historyPeriod}
              loading={historyLoading}
              onPeriodChange={changeHistoryPeriod}
            />
          )}

          {notice && <p className="portfolio-notice" role="status">{notice}</p>}

          {items.length ? (
            <div className="portfolio-items">
              <div className="portfolio-items-heading">
                <div><p className="portfolio-kicker">Tvoje produkty</p><h2>Položky portfolia</h2></div>
                <span>{items.length}</span>
              </div>
              {items.map((item) => {
                const current = (item.product.marketPrice ?? item.buyPrice) * item.quantity;
                const invested = item.buyPrice * item.quantity;
                const profit = current - invested;
                const change = invested ? ((current - invested) / invested) * 100 : 0;
                return (
                  <article className="portfolio-item" key={item.id}>
                    <div className="portfolio-product-image"><ProductImage product={item.product} /></div>
                    <div className="portfolio-item-copy">
                      <span>{item.product.set} · {item.product.type}</span>
                      <h3>{item.product.name}</h3>
                      <p>{item.quantity} ks · nákup {formatCzk(item.buyPrice)} · {item.buyDate}</p>
                    </div>
                    <div className="portfolio-product-value">
                      <small>Aktuální hodnota</small>
                      <strong>{formatCzk(current)}</strong>
                      <span className={change >= 0 ? "is-positive" : "is-negative"}>
                        {profit > 0 ? "+" : ""}{formatCzk(profit)} · {formatPercent(change)}
                      </span>
                    </div>
                    <div className="portfolio-item-actions" aria-label={`Akce pro ${item.product.name}`}>
                      <button
                        className="portfolio-item-action portfolio-edit"
                        type="button"
                        onClick={() => setEditing(item)}
                        aria-label={`Upravit ${item.product.name}`}
                        title="Upravit produkt"
                      >
                        <Pencil size={17} strokeWidth={2.2} aria-hidden="true" />
                      </button>
                      <button
                        className="portfolio-item-action portfolio-remove"
                        type="button"
                        onClick={() => removeItem(item)}
                        aria-label={`Odebrat ${item.product.name}`}
                        title="Smazat z portfolia"
                      >
                        <Trash2 size={17} strokeWidth={2.2} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="portfolio-empty">
              <span aria-hidden="true">+</span>
              <h2>Portfolio čeká na první produkt</h2>
              <p>Vyber produkt z portfolio databáze a doplň cenu a datum nákupu.</p>
              <button className="portfolio-button-primary" type="button" onClick={() => setAdding(true)}>
                Přidat první produkt
              </button>
            </div>
          )}
        </section>
      )}

      <footer className="portfolio-footer">
        <span>© 2026 TCG Ceny</span>
        <span>Tržní hodnoty jsou orientační a vycházejí z posledních dostupných cen.</span>
      </footer>

      {adding && (
        <AddItemDialog
          products={products}
          initialProductId={initialProductId}
          onClose={() => {
            setAdding(false);
            setInitialProductId(null);
            window.history.replaceState({}, "", "/portfolio/");
          }}
          onCreated={(item) => {
            setItems((current) => [item, ...current]);
            void loadHistory(historyPeriod);
            setNotice("Produkt byl přidán do portfolia.");
          }}
        />
      )}

      {editing && (
        <EditItemDialog
          item={editing}
          onClose={() => setEditing(null)}
          onUpdated={(updated) => {
            setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
            void loadHistory(historyPeriod);
            setNotice("Změny produktu byly uloženy.");
          }}
        />
      )}
    </main>
  );
}
