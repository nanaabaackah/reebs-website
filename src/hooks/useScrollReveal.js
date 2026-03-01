import { useEffect } from "react";

const REVEAL_SELECTORS = [
  "main section",
  "main article",
  "main .site-footer",
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
  if (element.closest(".loader, .site-loader, .shop-skeleton, .cookie-banner")) return true;
  if (element.classList.contains("site-header")) return true;
  if (element.classList.contains("shell-bottom-cta")) return true;
  if (element.classList.contains("back-to-top")) return true;
  if (element.classList.contains("party-confetti")) return true;
  return false;
};

const runRevealAnimation = (element, keyframes, options) => {
  if (typeof element.animate !== "function") return;
  const animation = element.animate(keyframes, {
    fill: "both",
    ...options,
  });

  if (typeof animation.addEventListener === "function") {
    animation.addEventListener(
      "finish",
      () => {
        animation.cancel();
      },
      { once: true }
    );
  }
};

const animateIn = (element, direction = "down") => {
  const fromY = direction === "up" ? -32 : 32;
  element.classList.remove("reveal-pending");
  element.classList.add("is-revealed");
  element.dataset.revealState = "visible";
  runRevealAnimation(
    element,
    [
      {
        opacity: 0,
        transform: `translate3d(0, ${fromY}px, 0) scale(0.94)`,
      },
      {
        opacity: 1,
        transform: "translate3d(0, 0, 0) scale(1)",
      },
    ],
    {
    duration: 620,
    delay: Number(element.dataset.revealDelay || 0),
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    }
  );
};

const animateOut = (element, direction = "down") => {
  const toY = direction === "up" ? 28 : -28;
  element.classList.add("reveal-pending");
  element.classList.remove("is-revealed");
  element.dataset.revealState = "hidden";
  runRevealAnimation(
    element,
    [
      {
        opacity: 1,
        transform: "translate3d(0, 0, 0) scale(1)",
      },
      {
        opacity: 0,
        transform: `translate3d(0, ${toY}px, 0) scale(0.96)`,
      },
    ],
    {
    duration: 340,
      easing: "cubic-bezier(0.55, 0.055, 0.675, 0.19)",
    }
  );
};

const markVisible = (element) => {
  element.classList.remove("reveal-pending");
  element.classList.add("is-revealed");
  element.dataset.revealState = "visible";
};

export default function useScrollReveal(pathname, scrollContainerRef) {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return undefined;
    if (!isPublicPath(pathname)) return undefined;

    const scrollHost = scrollContainerRef?.current || window;
    const observerRoot = scrollHost === window ? null : scrollHost;
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

    let scrollDirection = "down";
    const readScrollTop = () =>
      scrollHost === window
        ? window.scrollY || window.pageYOffset || 0
        : scrollHost.scrollTop;
    let lastScrollTop = readScrollTop();
    const updateDirection = () => {
      const next = readScrollTop();
      if (next > lastScrollTop) scrollDirection = "down";
      else if (next < lastScrollTop) scrollDirection = "up";
      lastScrollTop = next;
    };

    scrollHost.addEventListener("scroll", updateDirection, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target;
          if (entry.isIntersecting) {
            if (target.dataset.revealState !== "visible") {
              animateIn(target, scrollDirection);
            }
            return;
          }

          if (target.dataset.revealState !== "hidden") {
            animateOut(target, scrollDirection);
          }
        });
      },
      {
        threshold: 0.16,
        root: observerRoot,
        rootMargin: "-8% 0px -8% 0px",
      }
    );

    targets.forEach((element, index) => {
      element.classList.add("reveal-pending");
      element.classList.remove("is-revealed");
      element.dataset.revealState = "hidden";
      element.dataset.revealDelay = String((index % 8) * 22);
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
      scrollHost.removeEventListener("scroll", updateDirection);
      targets.forEach((element) => {
        delete element.dataset.revealDelay;
        delete element.dataset.revealState;
      });
    };
  }, [pathname, scrollContainerRef]);
}
