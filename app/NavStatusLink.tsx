"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export const ALERTS_READ_EVENT = "tcg-ceny:alerts-read";
const PRICE_DROP_SEEN_KEY = "tcg-ceny:last-seen-market-change:v1";
const CHANGES_READ_EVENT = "tcg-ceny:changes-read";
const PRICE_DROP_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

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

async function loadNewDrops(force = false) {
  if (!force && newDropsSnapshot !== null) return newDropsSnapshot;
  if (!dropsRequest) {
    dropsRequest = (async () => {
      const response = await fetch("/api/catalog/changes?days=30&limit=1", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return false;
      const data = await response.json() as PriceDropSummary;
      const latest = data.items?.[0]?.occurred_at || "";
      if (!latest) return false;
      const previous = lastSeenPriceDrop();
      if (!previous) {
        rememberLatestPriceDrop(latest);
        return false;
      }
      return new Date(latest).getTime() > new Date(previous).getTime();
    })().then((value) => {
      newDropsSnapshot = value;
      return value;
    }).catch(() => newDropsSnapshot ?? false).finally(() => {
      dropsRequest = null;
    });
  }
  return dropsRequest;
}

export function notifyAlertsRead() {
  unreadSnapshot = 0;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ALERTS_READ_EVENT));
}

export function rememberLatestPriceDrop(value: string | null | undefined) {
  if (!value || typeof window === "undefined" || !Number.isFinite(Date.parse(value))) return;
  const previous = lastSeenPriceDrop();
  if (previous && Date.parse(previous) >= Date.parse(value)) return;
  try {
    window.localStorage.setItem(PRICE_DROP_SEEN_KEY, value);
  } catch {
    // Storage can be disabled; the public feed must remain usable.
    return;
  }
  newDropsSnapshot = false;
  window.dispatchEvent(new Event(CHANGES_READ_EVENT));
}

export function lastSeenPriceDrop() {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(PRICE_DROP_SEEN_KEY);
    return value && Number.isFinite(Date.parse(value)) ? value : null;
  } catch {
    return null;
  }
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
  const label = kind === "watching" ? "Sledování" : "Slevy a naskladnění";

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
    let active = true;
    const markRead = () => setHasNewDrops(false);
    window.addEventListener(CHANGES_READ_EVENT, markRead);
    const refresh = (force = false) => {
      void loadNewDrops(force).then((value) => {
        if (active) setHasNewDrops(value);
      });
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh(true);
    };

    refresh();
    const intervalId = window.setInterval(() => refresh(true), PRICE_DROP_REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refreshWhenVisible);
    window.addEventListener("online", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      active = false;
      window.removeEventListener(CHANGES_READ_EVENT, markRead);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshWhenVisible);
      window.removeEventListener("online", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
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
        <span className="nav-new-drop" aria-label="Nová zlevnění nebo naskladnění">Nové</span>
      )}
    </Link>
  );
}
