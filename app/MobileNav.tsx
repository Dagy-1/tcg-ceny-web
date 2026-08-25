"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import NavStatusLink from "./NavStatusLink";

const links = [
  { href: "/", label: "Domů" },
  { href: "/katalog/", label: "Katalog" },
  { href: "/zlevneni/", label: "Zlevnění" },
  { href: "/porovnani/", label: "Porovnání" },
  { href: "/portfolio/", label: "Portfolio" },
  { href: "/sledovani/", label: "Sledování" },
  { href: "/#funkce", label: "Funkce" },
  { href: "/pro-eshopy/", label: "Pro e-shopy" },
];

const normalizePath = (value: string) => value.replace(/\/+$/, "") || "/";

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="mobile-nav" ref={menuRef}>
      <button
        className="mobile-nav-trigger"
        type="button"
        aria-label={open ? "Zavřít hlavní menu" : "Otevřít hlavní menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>

      {open && (
        <div id="mobile-navigation" className="mobile-nav-panel">
          {links.map((link) => {
            const route = normalizePath(link.href.split("#")[0] || "/");
            const isActive = !link.href.includes("#") && normalizePath(pathname) === route;
            if (link.href === "/sledovani/" || link.href === "/zlevneni/") {
              return (
                <NavStatusLink
                  kind={link.href === "/sledovani/" ? "watching" : "drops"}
                  current={isActive}
                  mobile
                  onNavigate={() => setOpen(false)}
                  key={link.href}
                />
              );
            }
            return (
              <Link
                className={isActive ? "is-active" : undefined}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setOpen(false)}
                key={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
