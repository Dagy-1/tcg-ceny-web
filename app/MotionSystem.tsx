"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const selector = "[data-motion]";

export default function MotionSystem() {
  const pathname = usePathname();

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observed = new WeakSet<Element>();
    const reveal = (element: Element) => element.classList.add("is-motion-visible");
    const observer = reducedMotion
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              reveal(entry.target);
              observer?.unobserve(entry.target);
            });
          },
          { rootMargin: "0px 0px -4%", threshold: 0.04 },
        );

    const register = (root: ParentNode) => {
      root.querySelectorAll(selector).forEach((element) => {
        if (observed.has(element)) return;
        observed.add(element);
        element.classList.add("is-motion-observed");
        if (reducedMotion) reveal(element);
        else observer?.observe(element);
      });
    };

    register(document);
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          register(node.matches(selector) ? node.parentNode ?? document : node);
        });
      });
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
