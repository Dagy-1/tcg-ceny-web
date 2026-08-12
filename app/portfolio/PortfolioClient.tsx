"use client";

import Link from "next/link";
import { CalendarDays, Check, ChevronDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuthMenu from "../AuthMenu";
import MobileNav from "../MobileNav";

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

type HistoryPeriod = 7 | 30 | 90 | 365 | "max";

type PortfolioHistoryPoint = {
  date: string;
  invested: number;
  marketValue: number;
  profit: number;
};

type PortfolioInvestmentPoint = {
  date: string;
  invested: number;
};

type PortfolioHistory = {
  days: number;
  points: PortfolioHistoryPoint[];
  investmentPoints: PortfolioInvestmentPoint[];
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

const historyPeriodOptions: Array<{ value: HistoryPeriod; label: string }> = [
  { value: 7, label: "7 dní" },
  { value: 30, label: "30 dní" },
  { value: 90, label: "90 dní" },
  { value: 365, label: "1 rok" },
  { value: "max", label: "Maximum" },
];

const portfolioRefreshIntervalMs = 60_000;

const today = () => new Date().toISOString().slice(0, 10);

const productDescriptor = (product: Product) =>
  [product.set, product.type].map((value) => value.trim()).filter(Boolean).join(" · ") || "Sealed produkt";

function productImageSource(source: string) {
  try {
    const url = new URL(source, window.location.origin);
    return url.hostname === "pokemonproductimages.pokedata.io"
      ? `/api/product-image?url=${encodeURIComponent(url.toString())}`
      : source;
  } catch {
    return source;
  }
}

function loadImage(source: string, signal: AbortSignal) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const abort = () => {
      image.src = "";
      reject(new DOMException("Image load aborted", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    image.onload = () => {
      signal.removeEventListener("abort", abort);
      resolve(image);
    };
    image.onerror = () => {
      signal.removeEventListener("abort", abort);
      reject(new Error("Product image could not be loaded"));
    };
    image.decoding = "async";
    image.src = source;
  });
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Transparent image could not be created")),
      "image/webp",
      0.86,
    );
  });
}

async function removeEdgeWhite(source: string, signal: AbortSignal) {
  const image = await loadImage(productImageSource(source), signal);
  if (signal.aborted) throw new DOMException("Image processing aborted", "AbortError");

  const maximumSide = 480;
  const scale = Math.min(1, maximumSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is unavailable");
  context.drawImage(image, 0, 0, width, height);

  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const removable = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let queueStart = 0;
  let queueEnd = 0;

  const enqueue = (x: number, y: number) => {
    const index = y * width + x;
    if (removable[index]) return;
    const offset = index * 4;
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    const alpha = pixels[offset + 3];
    const minimum = Math.min(red, green, blue);
    const maximum = Math.max(red, green, blue);
    if (alpha !== 0 && (minimum < 224 || maximum - minimum > 24)) return;
    removable[index] = 1;
    queue[queueEnd++] = index;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (queueStart < queueEnd) {
    const index = queue[queueStart++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(x - 1, y);
    if (x + 1 < width) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y + 1 < height) enqueue(x, y + 1);
  }

  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let index = 0; index < removable.length; index += 1) {
    const offset = index * 4;
    if (removable[index]) {
      const whiteness = Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
      pixels[offset + 3] = Math.max(0, Math.min(255, (240 - whiteness) * 16));
    }
    if (pixels[offset + 3] > 8) {
      const x = index % width;
      const y = Math.floor(index / width);
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  context.putImageData(imageData, 0, 0);

  if (right < left || bottom < top) throw new Error("Product image is empty");
  const padding = 2;
  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(width - 1, right + padding);
  bottom = Math.min(height - 1, bottom + padding);
  const output = document.createElement("canvas");
  output.width = right - left + 1;
  output.height = bottom - top + 1;
  output.getContext("2d")?.drawImage(
    canvas,
    left,
    top,
    output.width,
    output.height,
    0,
    0,
    output.width,
    output.height,
  );
  return canvasBlob(output);
}

function isPokeDataImage(source: string) {
  try {
    return new URL(source, "https://tcgceny.cz").hostname === "pokemonproductimages.pokedata.io";
  } catch {
    return false;
  }
}

function ResolvedProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  const [displaySource, setDisplaySource] = useState(() =>
    product.image && !isPokeDataImage(product.image) ? product.image : "",
  );

  useEffect(() => {
    if (!product.image) return;

    let objectUrl = "";
    const controller = new AbortController();
    const source = product.image;
    if (!isPokeDataImage(source)) return () => controller.abort();

    removeEdgeWhite(source, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setDisplaySource(objectUrl);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setFailed(true);
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [product.image]);

  if (!product.image || failed || !displaySource) {
    return <span className="portfolio-image-fallback">TCG</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={displaySource} alt="" onError={() => setFailed(true)} />
  );
}

function ProductImage({ product }: { product: Product }) {
  return <ResolvedProductImage key={product.image || product.id} product={product} />;
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
                    <small>{productDescriptor(product)}</small>
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
            <small>{productDescriptor(item.product)}</small>
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
  const [demoPeriod, setDemoPeriod] = useState<HistoryPeriod>(90);
  const examples = products
    .filter((product) =>
      product.marketPrice !== null &&
      product.marketPrice < 100_000 &&
      (product.era.includes("Mega Evolution") || product.era.includes("Scarlet")),
    )
    .slice(0, 4);
  const current = examples.reduce((sum, product) => sum + (product.marketPrice ?? 0), 0);
  const invested = Math.round(current * 0.86);
  const demoHistory: PortfolioHistory = (() => {
    const days = demoPeriod === "max" ? 730 : demoPeriod;
    const samples = demoPeriod === 7 ? 7 : demoPeriod === 30 ? 8 : 10;
    const marketFactors = [0.91, 0.94, 0.93, 0.99, 1.02, 1.06, 1.09, 1.12, 1.14, current / Math.max(invested, 1)];
    const investmentFactors = [0.42, 0.42, 0.64, 0.64, 0.82, 0.82, 1, 1, 1, 1];
    const start = new Date();
    start.setUTCHours(12, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - days);
    const dateAt = (index: number) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + Math.round((days * index) / (samples - 1)));
      return date.toISOString().slice(0, 10);
    };
    const points = Array.from({ length: samples }, (_, index) => {
      const factorIndex = Math.round((index * (marketFactors.length - 1)) / (samples - 1));
      const marketValue = index === samples - 1
        ? current
        : Math.round(invested * marketFactors[factorIndex]);
      const investedValue = Math.round(invested * investmentFactors[factorIndex]);
      return {
        date: dateAt(index),
        invested: investedValue,
        marketValue,
        profit: marketValue - investedValue,
      };
    });
    const investmentPoints = points.filter((point, index) => (
      index === 0 || point.invested !== points[index - 1].invested
    )).map((point) => ({ date: point.date, invested: point.invested }));
    return {
      days,
      points,
      investmentPoints,
      firstDate: points[0]?.date ?? null,
      latestDate: points.at(-1)?.date ?? null,
    };
  })();
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
        <PortfolioHistoryChart
          history={demoHistory}
          period={demoPeriod}
          loading={false}
          onPeriodChange={setDemoPeriod}
          demo
        />
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

function stepChartPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    path += ` L ${current.x} ${previous.y} L ${current.x} ${current.y}`;
  }
  return path;
}

function portfolioAxisStep(maximumValue: number, valueRange: number) {
  let step = maximumValue < 5_000
    ? 250
    : maximumValue < 20_000
      ? 500
      : maximumValue < 50_000
        ? 1_000
        : maximumValue < 100_000
          ? 2_500
          : 5_000;

  while (valueRange / step > 4) step *= 2;
  return step;
}

function portfolioAxisScale(values: number[]) {
  const rawMinimum = values.length ? Math.min(...values) : 0;
  const rawMaximum = values.length ? Math.max(...values) : 1;
  const step = portfolioAxisStep(rawMaximum, rawMaximum - rawMinimum);
  let minimum = Math.max(0, Math.floor(rawMinimum / step) * step);
  let maximum = Math.ceil(rawMaximum / step) * step;

  if (minimum === maximum) {
    minimum = Math.max(0, minimum - step);
    maximum += step;
  } else if (maximum - minimum < step * 2) {
    if (minimum >= step) minimum -= step;
    else maximum += step;
  }

  const ticks = Array.from(
    { length: Math.round((maximum - minimum) / step) + 1 },
    (_, index) => minimum + index * step,
  );

  return { minimum, maximum, ticks };
}

function PortfolioHistoryChart({
  history,
  period,
  loading,
  onPeriodChange,
  demo = false,
}: {
  history: PortfolioHistory | null;
  period: HistoryPeriod;
  loading: boolean;
  onPeriodChange: (period: HistoryPeriod) => void;
  demo?: boolean;
}) {
  const [activeTarget, setActiveTarget] = useState<{
    series: "market" | "invested";
    index: number;
  } | null>(null);
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const periodPickerRef = useRef<HTMLDivElement>(null);
  const points = history?.points ?? [];
  const investmentPoints = history?.investmentPoints?.length
    ? history.investmentPoints
    : points.map((point) => ({ date: point.date, invested: point.invested }));
  const width = 760;
  const height = 280;
  const plot = { left: 82, right: 18, top: 22, bottom: 45 };
  const bottom = height - plot.bottom;
  const plotWidth = width - plot.left - plot.right;
  const values = [
    ...points.map((point) => point.marketValue),
    ...investmentPoints.map((point) => point.invested),
  ];
  const { minimum, maximum, ticks: axisTicks } = portfolioAxisScale(values);
  const chartDates = [...new Set([
    ...points.map((point) => point.date),
    ...investmentPoints.map((point) => point.date),
  ])].sort();
  const chartEndDate = chartDates.at(-1) ?? null;
  const lastInvestmentPoint = investmentPoints.at(-1) ?? null;
  const investmentContinuesToChartEnd = Boolean(
    chartEndDate
      && lastInvestmentPoint
      && lastInvestmentPoint.date < chartEndDate,
  );
  const displayedInvestmentPoints = investmentContinuesToChartEnd
    ? [
        ...investmentPoints,
        {
          date: chartEndDate as string,
          invested: lastInvestmentPoint?.invested ?? 0,
        },
      ]
    : investmentPoints;
  const firstTimestamp = chartDates.length ? Date.parse(`${chartDates[0]}T12:00:00`) : 0;
  const lastTimestamp = chartDates.length
    ? Date.parse(`${chartDates.at(-1)}T12:00:00`)
    : firstTimestamp;
  const xForDate = (value: string) => (
    firstTimestamp === lastTimestamp
      ? plot.left + plotWidth / 2
      : plot.left
        + ((Date.parse(`${value}T12:00:00`) - firstTimestamp) / (lastTimestamp - firstTimestamp))
          * plotWidth
  );
  const yFor = (value: number) => plot.top + ((maximum - value) / (maximum - minimum)) * (bottom - plot.top);
  const marketPoints = points.map((point) => ({ x: xForDate(point.date), y: yFor(point.marketValue) }));
  const investedPoints = displayedInvestmentPoints.map((point) => ({
    x: xForDate(point.date),
    y: yFor(point.invested),
  }));
  const marketPath = smoothChartPath(marketPoints);
  const investedPath = stepChartPath(investedPoints);
  const areaPath = marketPoints.length > 1
    ? `${marketPath} L ${marketPoints.at(-1)?.x} ${bottom} L ${marketPoints[0].x} ${bottom} Z`
    : "";
  const latest = points.at(-1) ?? null;
  const first = points[0] ?? null;
  const change = latest && first ? latest.marketValue - first.marketValue : 0;
  const changePercent = first?.marketValue ? (change / first.marketValue) * 100 : 0;
  const periodLabel = historyPeriodOptions.find((option) => option.value === period)?.label ?? "Období";
  const demoPeriodText = period === "max" ? "celé období" : periodLabel.toLowerCase();
  const activeMarket = activeTarget?.series === "market"
    ? points[Math.min(activeTarget.index, Math.max(points.length - 1, 0))] ?? null
    : null;
  const activeInvestment = activeTarget?.series === "invested"
    ? displayedInvestmentPoints[
        Math.min(activeTarget.index, Math.max(displayedInvestmentPoints.length - 1, 0))
      ] ?? null
    : null;
  const activeInvestmentIsContinuation = Boolean(
    activeInvestment
      && investmentContinuesToChartEnd
      && activeTarget?.series === "invested"
      && activeTarget.index === displayedInvestmentPoints.length - 1,
  );
  const activeDate = activeMarket?.date ?? activeInvestment?.date ?? null;
  const activeX = activeDate
    ? Math.max(10, Math.min(90, (xForDate(activeDate) / width) * 100))
    : 50;
  const activeInvested = activeMarket
    ? [...investmentPoints]
        .reverse()
        .find((point) => point.date <= activeMarket.date)?.invested ?? activeMarket.invested
    : activeInvestment?.invested ?? 0;
  const formatDate = (value: string) => new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));

  useEffect(() => {
    if (!periodMenuOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!periodPickerRef.current?.contains(event.target as Node)) setPeriodMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPeriodMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [periodMenuOpen]);

  const pointerX = (event: React.PointerEvent<SVGPathElement>) => {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!bounds) return 0;
    return Math.max(0, Math.min(width, ((event.clientX - bounds.left) / bounds.width) * width));
  };

  const selectMarketPoint = (event: React.PointerEvent<SVGPathElement>) => {
    if (!points.length) return;
    const cursorX = pointerX(event);
    const nearest = marketPoints.reduce(
      (best, point, index) => (
        Math.abs(point.x - cursorX) < Math.abs(marketPoints[best].x - cursorX)
          ? index
          : best
      ),
      0,
    );
    setActiveTarget({ series: "market", index: nearest });
  };

  const selectInvestmentPoint = (event: React.PointerEvent<SVGPathElement>) => {
    if (!displayedInvestmentPoints.length) return;
    const cursorX = pointerX(event);
    let index = 0;
    displayedInvestmentPoints.forEach((point, pointIndex) => {
      if (xForDate(point.date) <= cursorX + 1) index = pointIndex;
    });
    setActiveTarget({ series: "invested", index });
  };

  const clearActiveTarget = () => setActiveTarget(null);

  return (
    <section className={`portfolio-history${demo ? " portfolio-history-demo" : ""}`} aria-label={demo ? "Ukázkový vývoj hodnoty portfolia" : "Vývoj hodnoty portfolia"}>
      <div className="portfolio-history-header">
        <div>
          <p className="portfolio-kicker">{demo ? "Hodnota v čase" : "Historie portfolia"}</p>
          <h2>{demo ? "Vývoj ukázkové sbírky" : "Vývoj hodnoty sbírky"}</h2>
          <p className="portfolio-history-description">
            {demo
              ? `Přepni období a prozkoumej, jak by se hodnota sbírky mohla vyvíjet za ${demoPeriodText}.`
              : "Tržní hodnota v čase, porovnaná s částkou, kterou jsi skutečně investoval."}
          </p>
        </div>
        <div className="portfolio-history-controls">
          {points.length > 1 && (
            <div className={`portfolio-history-movement ${change > 0 ? "is-positive" : change < 0 ? "is-negative" : "is-neutral"}`}>
              <span>Pohyb od {formatDate(points[0].date)}</span>
              <strong>{change > 0 ? "+" : ""}{formatCzk(change)}</strong>
              <small>{formatPercent(changePercent)}</small>
            </div>
          )}
          <div
            ref={periodPickerRef}
            className={`portfolio-period-picker ${periodMenuOpen ? "is-open" : ""}`}
          >
            <button
              type="button"
              className="portfolio-period-trigger"
              aria-label={`Zvolit období grafu, nyní ${periodLabel}`}
              aria-expanded={periodMenuOpen}
              aria-haspopup="menu"
              onClick={() => setPeriodMenuOpen((open) => !open)}
            >
              <CalendarDays size={16} aria-hidden="true" />
              <span>{periodLabel}</span>
              <ChevronDown size={15} aria-hidden="true" />
            </button>
            <div className="portfolio-period-menu" role="menu" aria-label="Období grafu">
              {historyPeriodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="menuitemradio"
                  aria-checked={period === option.value}
                  className={period === option.value ? "is-active" : ""}
                  onClick={() => {
                    setActiveTarget(null);
                    setPeriodMenuOpen(false);
                    onPeriodChange(option.value);
                  }}
                >
                  <span>{option.label}</span>
                  {period === option.value && <Check size={15} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && !history ? (
        <div className="portfolio-history-loading"><span /> Načítám skutečný vývoj sbírky…</div>
      ) : points.length ? (
        <>
          {chartDates.length > 1 ? (
            <>
          <div className="portfolio-history-visual">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`Tržní hodnota portfolia za období ${periodLabel}`}
              onPointerLeave={clearActiveTarget}
            >
              {[...axisTicks].reverse().map((axisValue) => {
                const y = yFor(axisValue);
                return (
                  <g key={axisValue}>
                    <text
                      className="portfolio-chart-axis-value"
                      x={plot.left - 12}
                      y={y + 4}
                      textAnchor="end"
                    >
                      {formatCzk(axisValue)}
                    </text>
                    <line className="portfolio-chart-grid" x1={plot.left} y1={y} x2={width - plot.right} y2={y} />
                  </g>
                );
              })}
              {areaPath && <path className="portfolio-chart-area" d={areaPath} />}
              {investedPath && <path className="portfolio-chart-invested" d={investedPath} />}
              {marketPath && <path className="portfolio-chart-market" d={marketPath} />}
              {investedPath && (
                <path
                  className="portfolio-chart-hit"
                  d={investedPath}
                  onPointerMove={selectInvestmentPoint}
                  onPointerDown={selectInvestmentPoint}
                />
              )}
              {marketPath && (
                <path
                  className="portfolio-chart-hit"
                  d={marketPath}
                  onPointerMove={selectMarketPoint}
                  onPointerDown={selectMarketPoint}
                />
              )}
              {marketPoints.map((point, index) => (
                <circle
                  key={points[index].date}
                  className={activeTarget?.series === "market" && index === activeTarget.index ? "portfolio-chart-dot is-active" : "portfolio-chart-dot"}
                  cx={point.x}
                  cy={point.y}
                  r={activeTarget?.series === "market" && index === activeTarget.index ? 5 : 3.5}
                />
              ))}
              {activeDate && (
                <line
                  className="portfolio-chart-cursor"
                  x1={xForDate(activeDate)}
                  y1={plot.top}
                  x2={xForDate(activeDate)}
                  y2={bottom}
                />
              )}
              <text className="portfolio-chart-date" x={plot.left} y={height - 13}>{formatDate(chartDates[0])}</text>
              <text className="portfolio-chart-date" x={width - plot.right} y={height - 13} textAnchor="end">
                {formatDate(chartDates.at(-1) ?? chartDates[0])}
              </text>
            </svg>
            {activeDate && (
              <div className={`portfolio-chart-tooltip ${activeInvestment ? "is-invested" : "is-market"}`} style={{ left: `${activeX}%` }}>
                <span>{formatDate(activeDate)}</span>
                {activeMarket ? (
                  <>
                    <strong>{formatCzk(activeMarket.marketValue)}</strong>
                    <small>Investováno {formatCzk(activeInvested)}</small>
                    <em className={activeMarket.marketValue - activeInvested > 0 ? "is-positive" : activeMarket.marketValue - activeInvested < 0 ? "is-negative" : "is-neutral"}>
                      Zisk / ztráta {activeMarket.marketValue - activeInvested > 0 ? "+" : ""}{formatCzk(activeMarket.marketValue - activeInvested)}
                      {" · "}{formatPercent(activeInvested ? ((activeMarket.marketValue - activeInvested) / activeInvested) * 100 : 0)}
                    </em>
                  </>
                ) : (
                  <>
                    <strong>{formatCzk(activeInvested)}</strong>
                    <small>
                      {activeInvestmentIsContinuation
                        ? "Celkem investováno k tomuto dni"
                        : "Celkem investováno po nákupu"}
                    </small>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="portfolio-history-legend">
            <span className="market">Tržní hodnota sbírky</span>
            <span className="invested">Celkem investováno</span>
            <small>{demo ? "Ilustrační demo · skutečné portfolio používá denní cenové záznamy" : `Skutečné denní záznamy od ${formatDate(points[0].date)}`}</small>
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
  const [availableProducts, setAvailableProducts] = useState(products);
  const portfolioRefreshInFlight = useRef(false);
  const productDatabaseInFlight = useRef<Promise<Product[]> | null>(null);

  const loadProductDatabase = useCallback(async () => {
    if (availableProducts.length >= productCount) return availableProducts;
    if (productDatabaseInFlight.current) return productDatabaseInFlight.current;

    productDatabaseInFlight.current = fetch("/portfolio-products.json", {
      cache: "force-cache",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Product database unavailable");
        const snapshot = await response.json() as { products?: Product[] };
        if (!Array.isArray(snapshot.products) || snapshot.products.length < productCount) {
          throw new Error("Product database is incomplete");
        }
        setAvailableProducts(snapshot.products);
        return snapshot.products;
      })
      .finally(() => {
        productDatabaseInFlight.current = null;
      });

    return productDatabaseInFlight.current;
  }, [availableProducts, productCount]);

  const openAddDialog = useCallback(async () => {
    try {
      await loadProductDatabase();
      setAdding(true);
    } catch {
      setNotice("Databázi produktů se teď nepodařilo načíst. Zkus to prosím znovu.");
    }
  }, [loadProductDatabase]);

  const loadHistory = useCallback(async (period: HistoryPeriod) => {
    setHistoryLoading(true);
    try {
      const days = period === "max" ? 0 : period;
      const response = await fetch(`/api/portfolio/history?days=${days}`, {
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

  const loadPortfolio = useCallback(async () => {
    if (portfolioRefreshInFlight.current) return null;
    portfolioRefreshInFlight.current = true;
    try {
      const response = await fetch("/api/portfolio", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("Portfolio unavailable");
      const portfolio = await response.json() as { items: PortfolioItem[] };
      setItems(portfolio.items);
      return portfolio.items;
    } finally {
      portfolioRefreshInFlight.current = false;
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
        setState("signed-in");
        try {
          const portfolioItems = await loadPortfolio();
          if (portfolioItems?.length) void loadHistory(90);
          if (add) void openAddDialog();
        } catch {
          setNotice("Jsi přihlášený, ale portfolio se teď nepodařilo načíst. Obnov stránku a zkus to znovu.");
        }
      })
      .catch(() => setState("signed-out"));
  }, [loadHistory, loadPortfolio, openAddDialog]);

  useEffect(() => {
    if (state === "signed-in") void loadProductDatabase().catch(() => undefined);
  }, [loadProductDatabase, state]);

  useEffect(() => {
    if (state !== "signed-in") return;

    const refresh = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const portfolioItems = await loadPortfolio();
        if (portfolioItems === null) return;
        if (portfolioItems.length) {
          void loadHistory(historyPeriod);
        } else {
          setHistory(null);
        }
      } catch {
        // Keep the last successful view. A later focus or interval retries quietly.
      }
    };
    const onFocus = () => void refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const interval = window.setInterval(() => void refresh(), portfolioRefreshIntervalMs);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [historyPeriod, loadHistory, loadPortfolio, state]);

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
          <Link href="/porovnani/">Porovnání</Link>
          <Link className="portfolio-nav-active" href="/portfolio/">Portfolio</Link>
          <Link href="/pro-eshopy/">Pro e-shopy</Link>
        </div>
        <div className="nav-actions">
          <AuthMenu />
          <MobileNav />
        </div>
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
            <button className="portfolio-button-primary" type="button" onClick={() => void openAddDialog()}>
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
                      <span>{productDescriptor(item.product)}</span>
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
              <button className="portfolio-button-primary" type="button" onClick={() => void openAddDialog()}>
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
          products={availableProducts}
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
