"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type SessionUser = {
  id: string;
  username: string;
  avatar: string | null;
  provider?: "discord" | "google";
  linkedProviders?: Array<"discord" | "google">;
};

const SESSION_USER_CACHE_KEY = "tcg_session_user";
let memorySessionUser: SessionUser | null | undefined;

function readCachedSessionUser() {
  if (memorySessionUser !== undefined) return memorySessionUser;
  try {
    const cached = window.sessionStorage.getItem(SESSION_USER_CACHE_KEY);
    if (!cached) return undefined;
    const parsed = JSON.parse(cached) as SessionUser;
    if (parsed && typeof parsed.id === "string" && typeof parsed.username === "string") {
      memorySessionUser = parsed;
      return parsed;
    }
  } catch {
    try {
      window.sessionStorage.removeItem(SESSION_USER_CACHE_KEY);
    } catch {
      // Ignore browsers that disable session storage entirely.
    }
  }
  return undefined;
}

function cacheSessionUser(user: SessionUser | null) {
  memorySessionUser = user;
  try {
    if (user) window.sessionStorage.setItem(SESSION_USER_CACHE_KEY, JSON.stringify(user));
    else window.sessionStorage.removeItem(SESSION_USER_CACHE_KEY);
  } catch {
    // The session remains valid even when browser storage is unavailable.
  }
}

function authErrorMessage(code: string | null) {
  if (code === "discord_not_configured") {
    return "Přihlášení přes Discord ještě není nakonfigurované.";
  }
  if (code === "google_not_configured") {
    return "Přihlášení přes Google ještě není nakonfigurované.";
  }
  if (code === "oauth_failed") {
    return "Přihlášení se nepodařilo dokončit. Zkus to prosím znovu.";
  }
  if (code === "identity_in_use") {
    return "Tento účet už patří jinému profilu. Kvůli ochraně portfolia jsme účty nespojili.";
  }
  if (code === "link_requires_login") {
    return "Pro propojení účtů se nejdříve znovu přihlas.";
  }
  if (code === "link_failed" || code === "link_unavailable") {
    return "Propojení účtů se nyní nepodařilo dokončit. Tvoje portfolio zůstalo beze změny.";
  }
  return "";
}

export default function AuthMenu() {
  const [user, setUser] = useState<SessionUser | null | undefined>(memorySessionUser);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [returnTo, setReturnTo] = useState("/");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cachedUser = readCachedSessionUser();
    if (cachedUser) queueMicrotask(() => setUser(cachedUser));

    const params = new URLSearchParams(window.location.search);
    const message = authErrorMessage(params.get("auth_error"));
    const linkedProvider = params.get("account_linked");
    if (message) {
      queueMicrotask(() => {
        setError(message);
        setOpen(true);
      });
      params.delete("auth_error");
    }
    if (linkedProvider === "discord" || linkedProvider === "google") {
      queueMicrotask(() => {
        setNotice(`Účet ${linkedProvider === "google" ? "Google" : "Discord"} je bezpečně propojený.`);
        setOpen(true);
      });
      params.delete("account_linked");
    }
    const query = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    const current = `${window.location.pathname}${query ? `?${query}` : ""}`;
    queueMicrotask(() => setReturnTo(current.startsWith("//") ? "/" : current));

    fetch("/api/session", {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => response.ok ? response.json() : { user: null })
      .then((data: { user: SessionUser | null }) => {
        cacheSessionUser(data.user);
        setUser(data.user);
      })
      .catch(() => setUser((current) => current ?? null));
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const loginHref = (provider: "discord" | "google") =>
    `/api/auth/${provider}?return_to=${encodeURIComponent(returnTo)}`;
  const linkHref = (provider: "discord" | "google") =>
    `/api/auth/${provider}?link=1&return_to=${encodeURIComponent(returnTo)}`;
  const alternateProvider = user?.provider === "google" ? "discord" : "google";
  const linkedProviders = user?.linkedProviders ?? (user?.provider ? [user.provider] : []);
  const canLinkAlternate = Boolean(user && !linkedProviders.includes(alternateProvider));
  const providerLabel = linkedProviders.includes("discord") && linkedProviders.includes("google")
    ? "Discord + Google"
    : user?.provider === "google" ? "Google" : "Discord";

  const logout = async () => {
    const response = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    });
    if (response.ok) {
      cacheSessionUser(null);
      window.location.reload();
    }
  };

  const isLoading = user === undefined;

  return (
    <div className="auth-menu" ref={root}>
      <button
        className={`button button-small auth-trigger${user ? " is-signed-in" : isLoading ? " is-loading" : ""}`}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={isLoading ? "Načítání přihlášeného účtu" : undefined}
        disabled={isLoading}
        onClick={() => setOpen((value) => !value)}
      >
        {isLoading ? (
          <>
            <span className="auth-avatar auth-avatar-placeholder" aria-hidden="true" />
            <span className="auth-username-placeholder" aria-hidden="true" />
          </>
        ) : user ? (
          <>
            <span className="auth-avatar" aria-hidden="true">
              {user.avatar?.startsWith("https://")
                ? <Image src={user.avatar} alt="" width={32} height={32} unoptimized />
                : user.username.slice(0, 1).toUpperCase()}
            </span>
            <span className="auth-username">{user.username}</span>
          </>
        ) : (
          <>Přihlásit se <span aria-hidden="true">⌄</span></>
        )}
      </button>

      {open && (
        <div className="auth-popover" role="menu">
          {user ? (
            <>
              <div className="auth-summary">
                <span className="auth-avatar large" aria-hidden="true">
                  {user.avatar?.startsWith("https://")
                    ? <Image src={user.avatar} alt="" width={40} height={40} unoptimized />
                    : user.username.slice(0, 1).toUpperCase()}
                </span>
                <span>
                  <small>Přihlášený účet</small>
                  <strong>{user.username}</strong>
                  <em>{providerLabel}</em>
                </span>
              </div>
              <Link className="auth-menu-link" href="/portfolio/" role="menuitem">
                Moje portfolio <span aria-hidden="true">→</span>
              </Link>
              <Link className="auth-menu-link" href="/sledovani/" role="menuitem">
                Moje sledování <span aria-hidden="true">→</span>
              </Link>
              {canLinkAlternate && (
                <a
                  className="auth-menu-link auth-link-account"
                  href={linkHref(alternateProvider)}
                  role="menuitem"
                >
                  Propojit {alternateProvider === "google" ? "Google" : "Discord"}
                  <span aria-hidden="true">+</span>
                </a>
              )}
              {notice && <p className="auth-notice" role="status">{notice}</p>}
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="auth-logout" type="button" role="menuitem" onClick={logout}>
                Odhlásit se
              </button>
            </>
          ) : (
            <>
              <div className="auth-popover-heading">
                <strong>Přihlásit se</strong>
                <span>Vyber účet, který chceš používat.</span>
              </div>
              <a className="auth-provider discord" href={loginHref("discord")} role="menuitem">
                <span className="auth-provider-mark" aria-hidden="true">D</span>
                <span><strong>Pokračovat přes Discord</strong><small>Pro členy TCG Ceny serveru</small></span>
                <b aria-hidden="true">→</b>
              </a>
              <a className="auth-provider google" href={loginHref("google")} role="menuitem">
                <span className="auth-provider-mark" aria-hidden="true">G</span>
                <span><strong>Pokračovat přes Google</strong><small>Gmail nebo jiný Google účet</small></span>
                <b aria-hidden="true">→</b>
              </a>
              {error && <p className="auth-error" role="alert">{error}</p>}
              <p className="auth-privacy">Heslo od Discordu ani Googlu nikdy nevidíme.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
