"use client";

import { useEffect } from "react";

export default function ScrollNavState() {
  useEffect(() => {
    const updateNavigation = () => {
      const isScrolled = window.scrollY > 12;

      document.querySelectorAll<HTMLElement>(".nav").forEach((navigation) => {
        navigation.classList.toggle("is-scrolled", isScrolled);
      });
    };

    updateNavigation();
    window.addEventListener("scroll", updateNavigation, { passive: true });

    return () => window.removeEventListener("scroll", updateNavigation);
  }, []);

  return null;
}
