"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export const ALERTS_READ_EVENT = "tcg-ceny:alerts-read";
const PRICE_DROP_SEEN_KEY = "tcg-ceny:last-seen-price-drop";

type AlertEventSummary = { unread?: number };
type PriceDropSummary = { items?: Array<{ occurred_at?: string }> };

let unreadSnapshot: number | null = null;
let unreadRequest: Promise<number> | null = null;
let newDropsSnapshot: boolean | null = null;
let dropsRequest: Promise<boolean> | null = null;

async function loadUnreadAlerts() {
  if (unreadSnapshot !== null) return unreadSnapshot;
  if (!unreadRequest) {
    unreadRequest = (async () => {
      const sessionResponse = await fetch("/api/session", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!sessionResponse.ok) return 0;
      const session = await sessionResponse.json() as { user?: unknown };
      if (!session.user) return 0;
      const response = await fetch("/api/alerts/events", {
        cache: "no-store",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return 0;
      const data = await response.json() as AlertEventSummary;
      return Math.max(0, Number(data.unread) || 0);
    })().then((value) => {
      unreadSnapshot = value;
      return value;
    }).catch(() => 0);
  }
  return unreadRequest;
}

async function loadNewDrops() {
  if (newDropsSnapshot !== null) return newDropsSnapshot;
  if (!dropsRequest) {
    dropsRequest = (async () => {
      const response = await fetch("/api/catalog/price-drops?days=30&limit=1", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return false;
      const data = await response.json() as PriceDropSummary;
      const latest = data.items?.[0]?.occurred_at || "";
      if (!latest) return false;
      const previous = window.localStorage.getItem(PRICE_DROP_SEEN_KEY);
      if (!previous) {
        window.localStorage.setItem(PRICE_DROP_SEEN_KEY, latest);
        return false;
      }
      return new Date(latest).getTime() > new Date(previous).getTime();
    })().then((value) => {
      newDropsSnapshot = value;
      return value;
    }).catch(() => false);
  }
  return dropsRequest;
}

export function notifyAlertsRead() {
  unreadSnapshot = 0;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ALERTS_READ_EVENT));
}

export function rememberLatestPriceDrop(value: string | null | undefined) {
  if (!value || typeof window === "undefined") return;
  window.localStorage.setItem(PRICE_DROP_SEEN_KEY, value);
  newDropsSnapshot = false;
}

export function lastSeenPriceDrop() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PRICE_DROP_SEEN_KEY);
}

type NavStatusLinkProps = {
  kind: "drops" | "watching";
  current?: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
};

export default function NavStatusLink({ kind, current = false, mobile = false, onNavigate }: NavStatusLinkProps) {
  const [unread, setUnread] = useState(0);
  const [hasNewDrops, setHasNewDrops] = useState(false);
  const href = kind === "watching" ? "/sledovani/" : "/zlevneni/";
  const label = kind === "watching" ? "Sledování" : "Zlevnění";

  useEffect(() => {
    const localPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname)
      && new URLSearchParams(window.location.search).get("nahled-alertu") === "1";
    if (localPreview) {
      queueMicrotask(() => {
        if (kind === "watching") setUnread(1);
        else setHasNewDrops(true);
      });
      return;
    }
    if (kind === "watching") {
      const update = () => setUnread(unreadSnapshot || 0);
      window.addEventListener(ALERTS_READ_EVENT, update);
      void loadUnreadAlerts().then(setUnread);
      return () => window.removeEventListener(ALERTS_READ_EVENT, update);
    }
    void loadNewDrops().then(setHasNewDrops);
  }, [kind]);

  return (
    <Link
      className={`nav-status-link${mobile ? " is-mobile" : ""}`}
      href={href}
      aria-current={current ? "page" : undefined}
      onClick={onNavigate}
    >
      <span>{label}</span>
      {kind === "watching" && unread > 0 && (
        <span className="nav-alert-count" aria-label={`${unread} nepřečtené ${unread === 1 ? "upozornění" : "upozornění"}`}>
          {unread > 99 ? "99+" : unread}
        </span>
      )}
      {kind === "drops" && hasNewDrops && !current && (
        <span className="nav-new-drop" aria-label="Nová zlevnění">Nové</span>
      )}
    </Link>
  );
}
