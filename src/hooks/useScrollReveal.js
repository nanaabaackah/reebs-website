import { useEffect } from "react";
import { animate } from "animejs";

const REVEAL_SELECTORS = [
  "main section",
  "main .glass-card",
  "main .rent-card",
  "main .shop-card",
  "main .gallery-card",
  "main .contact-card",
  "main .faq-item",
  "main .policy-card",
  "main .policy-detail",
  "main .booking-rental-card",
  "main .cart-line",
  "main .checkout-card",
];

const isPublicPath = (pathname = "") => {
  const normalized = pathname.toLowerCase();
  return !normalized.startsWith("/admin") && !normalized.startsWith("/login");
};

const shouldSkipElement = (element) => {
  if (!(element instanceof HTMLElement)) return true;
  if (element.closest("[data-no-reveal='true']")) return true;
  if (element.closest(".loader, .shop-skeleton")) return true;
  if (element.classList.contains("party-confetti")) return true;
  return false;
};

const markVisible = (element) => {
  element.classList.remove("reveal-pending");
  element.classList.add("is-revealed");
};

export default function useScrollReveal(pathname) {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;
    if (!isPublicPath(pathname)) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const reduceData = window.matchMedia("(prefers-reduced-data: reduce)").matches;
    const lowPowerDevice = (window.navigator?.hardwareConcurrency || 8) <= 4;

    const selector = REVEAL_SELECTORS.join(", ");
    const targets = Array.from(document.querySelectorAll(selector)).filter(
      (element) => !shouldSkipElement(element)
    );

    if (!targets.length) return undefined;

    if (reduceMotion || reduceData || lowPowerDevice) {
      targets.forEach(markVisible);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const target = entry.target;
          observer.unobserve(target);

          markVisible(target);
          animate(target, {
            opacity: [0, 1],
            y: [26, 0],
            scale: [0.985, 1],
            duration: 650,
            ease: "out(3)",
            delay: Number(target.dataset.revealDelay || 0),
          });
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    targets.forEach((element, index) => {
      element.classList.add("reveal-pending");
      element.classList.remove("is-revealed");
      element.dataset.revealDelay = String((index % 8) * 22);
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      targets.forEach((element) => {
        delete element.dataset.revealDelay;
      });
    };
  }, [pathname]);
}
