import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "../styles/public.css";
import "/src/styles/Shop.css";
import { AppIcon } from "/src/components/Icon";
import {
  faMagnifyingGlass,
  faTimes,
} from "/src/icons/iconSet";
import AddToCartButton from "/src/components/AddToCartButton";
import CookieBanner from "/src/components/CookieBanner";
import { useAuth } from "/src/components/AuthContext";
import SideNav from "/src/components/SideNav";
import SiteLoader from "/src/components/SiteLoader";
import { useCart } from "/src/components/CartContext";
import SearchField from "/src/components/SearchField";
import {
  isOnlineShopItem,
  isTestCategoryItem,
} from "/src/utils/frontendInventoryFilters";
import { fetchInventoryWithCache } from "/src/utils/inventoryCache";

const SHOP_CACHE_KEY = "reebs_shop_inventory_v2";
const SHOP_CACHE_TTL = 5 * 60 * 1000;
const SHOP_CATEGORY_PAGE_SIZE = 15;
const SHOP_BG_ASSETS = [
  "/imgs/shopbg/img_1.png",
  "/imgs/shopbg/img_2.png",
  "/imgs/shopbg/img_3.png",
  "/imgs/shopbg/img_4.png",
  "/imgs/shopbg/img_5.png",
  "/imgs/shopbg/img_6.png",
  "/imgs/shopbg/img_7.png",
];
const SHOP_CATEGORY_BG_MAP = {
  "party supplies": "/imgs/shopbg/img_1.png",
  "kids toys": "/imgs/shopbg/img_2.png",
  toys: "/imgs/shopbg/img_2.png",
  "household supplies": "/imgs/shopbg/img_3.png",
  "home supplies": "/imgs/shopbg/img_3.png",
  stationery: "/imgs/shopbg/img_4.png",
  "event supplies": "/imgs/shopbg/img_5.png",
  "gift items": "/imgs/shopbg/img_6.png",
  other: "/imgs/shopbg/img_7.png",
  test: "/imgs/shopbg/img_7.png",
};

const slugify = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const isUnavailableImageSource = (src = "") => {
  const normalized = src.toString().trim().toLowerCase();
  if (!normalized) return true;
  return normalized.includes("placeholder");
};

const hashString = (value = "") => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const normalizeCategoryKey = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const toTitleCase = (value = "") =>
  value.replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeShopCategoryLabel = (value = "") => {
  const key = normalizeCategoryKey(value);
  if (!key) return "Other";

  if (["kids toys", "kid toys", "kids toy", "kid toy"].includes(key)) {
    return "Kids Toys";
  }
  if (["party supplies", "party supply"].includes(key)) {
    return "Party Supplies";
  }
  if (
    [
      "household supplies",
      "household supply",
      "household items",
      "household item",
      "home supplies",
      "home supply",
      "home items",
      "home item",
    ].includes(key)
  ) {
    return "Household Supplies";
  }
  if (["gift items", "gift item"].includes(key)) {
    return "Gift Items";
  }

  return toTitleCase(key);
};

function ShopImageAsset({ src, alt, fallbackClassName = "" }) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const showFallback = isUnavailableImageSource(src) || imageError;

  if (showFallback) {
    return (
      <div
        className={`shop-image-fallback ${fallbackClassName}`.trim()}
        role="img"
        aria-label={`${alt || "Item"} image not available`}
      >
        <span>Image not available</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setImageError(true)}
    />
  );
}

const readShopCache = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SHOP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.items || !parsed?.ts) return null;
    if (Date.now() - parsed.ts > SHOP_CACHE_TTL) return null;
    return parsed.items;
  } catch {
    return null;
  }
};

const writeShopCache = (items) => {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      SHOP_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), items })
    );
  } catch {
    // ignore cache write failures
  }
};

const getCategoryPageState = (items, currentPage = 0) => {
  const pageCount = Math.max(1, Math.ceil(items.length / SHOP_CATEGORY_PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount - 1);
  const start = safePage * SHOP_CATEGORY_PAGE_SIZE;

  return {
    currentPage: safePage,
    pageCount,
    visibleItems: items.slice(start, start + SHOP_CATEGORY_PAGE_SIZE),
  };
};

function Shop() {
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [announce, setAnnounce] = useState("");
  const [activeHeroPanelIndex, setActiveHeroPanelIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showSideNav, setShowSideNav] = useState(false);
  const [categoryPages, setCategoryPages] = useState({});
  const gridRef = useRef(null);
  const [searchParams] = useSearchParams();

  const { isAuthenticated, authReady } = useAuth();
  const { convertPrice, formatCurrency, openCart } = useCart();
  const routeSearchQuery = (searchParams.get("q") || "").trim();

  const getPrice = useCallback(
    (item) =>
      item.price ??
      (typeof item.priceCents === "number" ? item.priceCents / 100 : undefined),
    []
  );

  const getQuantity = useCallback((item) => item.quantity ?? item.stock ?? 0, []);

  const getCategoryLabel = useCallback((item) => {
    const raw = item.specificCategory || item.specificcategory || item.type || item.category;
    return normalizeShopCategoryLabel(raw);
  }, []);

  const getShopCategoryBackground = useCallback(
    (item) => {
      const category = normalizeCategoryKey(getCategoryLabel(item));
      if (SHOP_CATEGORY_BG_MAP[category]) return SHOP_CATEGORY_BG_MAP[category];

      const fallbackIndex = hashString(category || "other") % SHOP_BG_ASSETS.length;
      return SHOP_BG_ASSETS[fallbackIndex];
    },
    [getCategoryLabel]
  );

  const getImage = useCallback((item) => item.image || item.imageUrl || "", []);

  const getStatusValue = useCallback((item) => {
    if (typeof item?.status === "string") return item.status.toLowerCase();
    if (item?.status === false || item?.isActive === false) return "unavailable";
    return "available";
  }, []);

  const isSoldOutItem = useCallback(
    (item) => getStatusValue(item) === "unavailable" || getQuantity(item) <= 0,
    [getQuantity, getStatusValue]
  );

  const hasRealImage = useCallback((item) => {
    const src = getImage(item);
    return !isUnavailableImageSource(src);
  }, [getImage]);

  useEffect(() => {
    let isMounted = true;
    const cached = readShopCache();
    const hasCached = Array.isArray(cached);
    if (hasCached) {
      setInventory(cached.filter(isOnlineShopItem));
    }
    setLoading(!hasCached);

    const controller = new AbortController();
    fetchInventoryWithCache({ signal: controller.signal })
      .then(({ items }) => {
        const visibleProducts = (Array.isArray(items) ? items : []).filter(
          isOnlineShopItem
        );
        if (!isMounted) return;
        setInventory(visibleProducts);
        writeShopCache(visibleProducts);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("Error fetching shop inventory:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    document.body.classList.add("shop-theme");
    return () => document.body.classList.remove("shop-theme");
  }, []);

  useEffect(() => {
    setSearchQuery(routeSearchQuery);
    setDebouncedQuery(routeSearchQuery);
    if (routeSearchQuery) {
      setCategoryFilter("All");
      setActiveCategory(null);
    }
  }, [routeSearchQuery]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const visibleInventory = useMemo(() => {
    if (isAuthenticated) return inventory;
    return inventory.filter((item) => !isTestCategoryItem(item));
  }, [inventory, isAuthenticated]);

  const categories = useMemo(() => {
    const uniq = new Set(visibleInventory.map((item) => getCategoryLabel(item)));
    return Array.from(uniq).sort((a, b) => a.localeCompare(b));
  }, [visibleInventory, getCategoryLabel]);

  useEffect(() => {
    if (categoryFilter !== "All" && !categories.includes(categoryFilter)) {
      setCategoryFilter("All");
    }
  }, [categories, categoryFilter]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    const matchesQuery = (item) => {
      if (!normalizedQuery) return true;
      const name = (item?.name || "").toString().toLowerCase();
      const description = (item?.description || "").toString().toLowerCase();
      const category = getCategoryLabel(item).toString().toLowerCase();
      return (
        name.includes(normalizedQuery) ||
        description.includes(normalizedQuery) ||
        category.includes(normalizedQuery)
      );
    };

    return [...visibleInventory]
      .filter(
        (item) =>
          (categoryFilter === "All" || getCategoryLabel(item) === categoryFilter) &&
          matchesQuery(item) &&
          (!inStockOnly || !isSoldOutItem(item))
      )
      .sort((a, b) => {
        const aHasImage = hasRealImage(a);
        const bHasImage = hasRealImage(b);
        if (aHasImage !== bHasImage) return aHasImage ? -1 : 1;

        const aSold = isSoldOutItem(a);
        const bSold = isSoldOutItem(b);
        if (aSold !== bSold) return aSold ? 1 : -1;

        return `${a.name || ""}`.localeCompare(`${b.name || ""}`);
      });
  }, [
    categoryFilter,
    debouncedQuery,
    getCategoryLabel,
    hasRealImage,
    inStockOnly,
    visibleInventory,
    isSoldOutItem,
  ]);

  const groupedProducts = useMemo(() => {
    const grouped = new Map();
    for (const item of filteredProducts) {
      const category = getCategoryLabel(item);
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(item);
    }

    return Array.from(grouped.keys())
      .sort((a, b) => a.localeCompare(b))
      .map((category) => ({
        category,
        id: slugify(category),
        items: grouped.get(category),
      }));
  }, [filteredProducts, getCategoryLabel]);

  const visibleNavItems = useMemo(
    () => groupedProducts.map(({ category, id }) => ({ id, label: category })),
    [groupedProducts]
  );
  const trimmedSearchQuery = searchQuery.trim();
  const hasActiveFilters = Boolean(
    trimmedSearchQuery || categoryFilter !== "All" || inStockOnly
  );
  const noShopMatches = groupedProducts.length === 0;
  const emptyStateTitle =
    visibleInventory.length === 0
      ? "No shop items are available right now"
      : "No shop items match your current filters";
  const emptyStateMessage =
    visibleInventory.length === 0
      ? "The catalog is temporarily empty. Check back soon or browse rentals while inventory updates."
      : "Try a broader keyword, switch categories, or clear your filters to bring items back.";

  useEffect(() => {
    setCategoryPages((prev) => {
      const next = {};
      let changed = false;

      for (const group of groupedProducts) {
        const { id, items } = group;
        const maxPage = Math.max(0, Math.ceil(items.length / SHOP_CATEGORY_PAGE_SIZE) - 1);
        const currentPage = prev[id] ?? 0;
        const clampedPage = Math.min(currentPage, maxPage);
        next[id] = clampedPage;
        if (clampedPage !== currentPage) {
          changed = true;
        }
      }

      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      if (prevKeys.length !== nextKeys.length) {
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [groupedProducts]);

  const heroProducts = useMemo(() => {
    const picturedItems = visibleInventory.filter(hasRealImage);
    const ranked = [...picturedItems]
      .filter((item) => !isSoldOutItem(item))
      .sort((a, b) => {
        const qtyDiff = getQuantity(b) - getQuantity(a);
        if (qtyDiff !== 0) return qtyDiff;
        return `${a.name || ""}`.localeCompare(`${b.name || ""}`);
      })
      .slice(0, 4);
    if (ranked.length) return ranked;

    return [...picturedItems]
      .sort((a, b) => {
        const qtyDiff = getQuantity(b) - getQuantity(a);
        if (qtyDiff !== 0) return qtyDiff;
        return `${a.name || ""}`.localeCompare(`${b.name || ""}`);
      })
      .slice(0, 4);
  }, [visibleInventory, getQuantity, hasRealImage, isSoldOutItem]);

  useEffect(() => {
    if (!heroProducts.length) {
      setActiveHeroPanelIndex(0);
      return;
    }
    setActiveHeroPanelIndex((prev) => Math.min(prev, heroProducts.length - 1));
  }, [heroProducts.length]);

  const handleSideNavItemClick = useCallback((id) => {
    const target = document.getElementById(id);
    if (!target) return;

    const scrollHost = document.querySelector(".main");
    const offset = 108;

    if (scrollHost) {
      const hostRect = scrollHost.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const nextTop = scrollHost.scrollTop + (targetRect.top - hostRect.top) - offset;
      scrollHost.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
    } else {
      const nextTop =
        (window.scrollY || window.pageYOffset || 0) +
        target.getBoundingClientRect().top -
        offset;
      window.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
    }

    setActiveCategory(id);
  }, []);

  const handleHeroPanelClick = useCallback(
    (item) => {
      const category = getCategoryLabel(item);
      const sectionId = slugify(category);
      setCategoryFilter(category);
      window.setTimeout(() => {
        handleSideNavItemClick(sectionId);
      }, 80);
    },
    [getCategoryLabel, handleSideNavItemClick]
  );

  useEffect(() => {
    const scrollHost = document.querySelector(".main");
    const scrollTarget = scrollHost || window;
    const sections = groupedProducts
      .map(({ id }) => document.getElementById(id))
      .filter((section) => section instanceof HTMLElement);

    if (!sections.length) {
      setActiveCategory(null);
      setShowSideNav(false);
      return undefined;
    }

    const getScrollTop = () =>
      scrollHost ? scrollHost.scrollTop : window.scrollY || window.pageYOffset || 0;

    const getOffsetTop = (element) => {
      if (!scrollHost) {
        return element.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
      }
      const hostRect = scrollHost.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      return scrollHost.scrollTop + (elementRect.top - hostRect.top);
    };

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const scrollTop = getScrollTop();
        const activeTrigger = scrollTop + 170;
        let currentId = sections[0].id;

        sections.forEach((section) => {
          if (activeTrigger >= getOffsetTop(section)) {
            currentId = section.id;
          }
        });

        setActiveCategory((prev) => (prev === currentId ? prev : currentId));

        const grid = document.getElementById("shop-catalog");
        if (grid) {
          const showThreshold = getOffsetTop(grid) - 140;
          const shouldShow = scrollTop >= showThreshold;
          setShowSideNav((prev) => (prev === shouldShow ? prev : shouldShow));
        }

        ticking = false;
      });
    };

    handleScroll();
    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollTarget.removeEventListener("scroll", handleScroll);
  }, [groupedProducts]);

  useEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl || typeof gridEl.scrollIntoView !== "function") return;
    gridEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [categoryFilter]);

  if (loading || !authReady) {
    return (
      <SiteLoader
        label="Loading shop"
        sublabel="Pulling in the latest online-available party supplies."
      />
    );
  }

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <CookieBanner />

      <main className="shop-page page-shell" role="main" id="main">
        <section id="shop-intro" className="shop-hero page-hero" aria-labelledby="shop-hero-heading">
          <div className="shop-hero-copy page-hero-copy">
            <h1 id="shop-hero-heading" className="page-hero-title">Shop everyday and event essentials</h1>
            <p className="shop-sub">
              Party picks, home supplies, stationery, and practical extras ready for quick
              pickup or delivery, with options that still pair smoothly with your rentals.
            </p>

            <div className="shop-hero-actions">
              <button
                className="shop-cart-btn hero-btn hero-btn-primary"
                onClick={() => openCart()}
              >
                View cart
              </button>
              <Link className="hero-btn hero-btn-ghost" to="/rentals">
                Browse rentals
              </Link>
            </div>

          </div>

          {heroProducts.length > 0 && (
            <div className="shop-hero-panels" role="list" aria-label="Popular shop items">
              {heroProducts.map((item, index) => {
                const isActive = index === activeHeroPanelIndex;
                const imageSrc = getImage(item);
                const hasImage = !isUnavailableImageSource(imageSrc);
                const categoryBg = getShopCategoryBackground(item);
                return (
                  <button
                    type="button"
                    key={item.id || item.productId || `${item.name}-${index}`}
                    className={`shop-hero-panel ${isActive ? "is-active" : ""} ${hasImage ? "" : "is-missing-image"}`}
                    role="listitem"
                    style={{ "--shop-panel-bg": `url("${categoryBg}")` }}
                    onMouseEnter={() => setActiveHeroPanelIndex(index)}
                    onFocus={() => setActiveHeroPanelIndex(index)}
                    onClick={() => handleHeroPanelClick(item)}
                  >
                    <ShopImageAsset
                      src={imageSrc}
                      alt={item.name || "Popular shop item"}
                      fallbackClassName="shop-hero-image-fallback"
                    />
                    <span className="shop-hero-panel-overlay" aria-hidden="true" />
                    <div className="shop-hero-panel-copy">
                      <p>{getCategoryLabel(item)}</p>
                      <h3>{item.name}</h3>
                      <span className="shop-hero-panel-cta">Browse this category →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section id="shop-catalog" className="shop-catalog-section">
          <div className="shop-catalog-main">
            <SideNav
              items={visibleNavItems}
              activeId={activeCategory}
              label="Shop categories"
              className={`glass-card shop-side-menu ${showSideNav ? "is-visible" : "is-hidden"}`}
              onItemClick={handleSideNavItemClick}
            />

            <div className="shop-catalog-content" ref={gridRef}>
              <div className="shop-toolbar glass-card">
                <div className="shop-toolbar-head">
                  <div>
                    <p className="kicker-small">Shop catalog</p>
                    <h2 className="shop-results-title">Find your items quickly</h2>
                    <p className="shop-meta">
                      {filteredProducts.length} items shown · {categories.length} categories
                    </p>
                  </div>
                  <div className="shop-toolbar-actions">
                    <label className="availability-filter">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                      />
                      In stock only
                    </label>
                  </div>
                </div>

                <div className="shop-controls">
                  <SearchField
                    className="search-wrapper"
                    inputClassName="search-bar"
                    clearClassName="shop-search-clear"
                    placeholder="Search balloons, decor, tableware..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClear={() => {
                      setSearchQuery("");
                      setDebouncedQuery("");
                    }}
                    clearAriaLabel="Clear shop search"
                    aria-label="Search shop products"
                  />
                </div>

                <div className="filter-chips" role="list" aria-label="Shop category filters">
                  <button
                    type="button"
                    className={`filter-chip ${categoryFilter === "All" ? "active" : ""}`}
                    onClick={() => setCategoryFilter("All")}
                    aria-pressed={categoryFilter === "All"}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`filter-chip ${categoryFilter === cat ? "active" : ""}`}
                      onClick={() => setCategoryFilter(cat)}
                      aria-pressed={categoryFilter === cat}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="shop-breadcrumb-row">
                  <span className="shop-results">
                    {filteredProducts.length === 0
                      ? "No items to show"
                      : `${filteredProducts.length} item${filteredProducts.length === 1 ? "" : "s"}`}
                  </span>
                </div>
              </div>

              {noShopMatches && (
                <div className="shop-empty glass-card" role="status" aria-live="polite">
                  <div className="shop-empty-icon" aria-hidden="true">
                    <AppIcon icon={faMagnifyingGlass} />
                  </div>
                  <div className="shop-empty-copy">
                    <p className="shop-empty-kicker">
                      {hasActiveFilters ? "No matches found" : "Inventory unavailable"}
                    </p>
                    <h2>{emptyStateTitle}</h2>
                    <p>{emptyStateMessage}</p>
                  </div>

                  {hasActiveFilters ? (
                    <div className="shop-empty-chips" aria-label="Active filters">
                      {trimmedSearchQuery ? (
                        <span className="shop-empty-chip">Search: {trimmedSearchQuery}</span>
                      ) : null}
                      {categoryFilter !== "All" ? (
                        <span className="shop-empty-chip">Category: {categoryFilter}</span>
                      ) : null}
                      {inStockOnly ? (
                        <span className="shop-empty-chip">In stock only</span>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="shop-empty-actions">
                    {hasActiveFilters ? (
                      <button
                        className="hero-btn hero-btn-primary"
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setDebouncedQuery("");
                          setCategoryFilter("All");
                          setInStockOnly(false);
                        }}
                      >
                        Reset filters
                      </button>
                    ) : null}
                    <Link
                      className={`hero-btn ${hasActiveFilters ? "hero-btn-ghost" : "hero-btn-primary"}`}
                      to="/rentals"
                    >
                      Browse rentals
                    </Link>
                  </div>
                </div>
              )}

              {groupedProducts.map(({ category, id, items }) => {
                const { currentPage, pageCount, visibleItems } = getCategoryPageState(
                  items,
                  categoryPages[id] ?? 0
                );

                return (
                  <div id={id} key={id} className="shop-category-section">
                    <div className="section-header shop-section-header">
                      <div className="shop-section-topline">
                        <span className="shop-section-count">{items.length} items</span>
                      </div>
                      <h2>{category}</h2>
                    </div>

                    <div className="shop-grid">
                      {visibleItems.map((item) => {
                        const isSoldOut = isSoldOutItem(item);
                        const imageSrc = getImage(item);
                        const canPreviewImage = !isUnavailableImageSource(imageSrc);
                        const categoryBg = getShopCategoryBackground(item);
                        return (
                          <article
                            key={item.id || item.productId || `${item.name}-${category}`}
                            className={`shop-card ${isSoldOut ? "sold-out" : ""}`}
                          >
                            <button
                              type="button"
                              className={`shop-image shop-image-trigger ${canPreviewImage ? "" : "is-disabled"}`}
                              onClick={() => {
                                if (!canPreviewImage) return;
                                setLightboxImage({
                                  image: imageSrc,
                                  background: categoryBg,
                                  name: item.name || "Shop item",
                                });
                              }}
                              aria-label={
                                canPreviewImage
                                  ? `Open image for ${item.name}`
                                  : `Image not available for ${item.name}`
                              }
                              style={{ "--shop-item-bg": `url("${categoryBg}")` }}
                              disabled={!canPreviewImage}
                            >
                              <ShopImageAsset
                                src={imageSrc}
                                alt={item.name}
                                fallbackClassName="shop-card-image-fallback"
                              />
                              {isSoldOut && <span className="shop-out-banner">Out of stock</span>}
                              {canPreviewImage && (
                                <span className="shop-zoom" aria-hidden="true">
                                  <AppIcon icon={faMagnifyingGlass} />
                                </span>
                              )}
                            </button>

                            <div className="shop-details">
                              <span className="shop-pill">{getCategoryLabel(item)}</span>
                              <h3>{item.name}</h3>
                              <p className="price">
                                {formatCurrency(convertPrice(getPrice(item) || 0))}
                              </p>
                              <p className="shop-stock">
                                {isSoldOut
                                  ? "Unavailable"
                                  : `${getQuantity(item)} left in stock`}
                              </p>
                              <AddToCartButton
                                item={{ ...item, quantity: getQuantity(item) }}
                                onCartChange={(action) => {
                                  if (action === "removed") {
                                    setAnnounce(`${item.name} removed from cart`);
                                  } else if (action === "decremented") {
                                    setAnnounce(`${item.name} quantity reduced`);
                                  } else if (action === "incremented") {
                                    setAnnounce(`${item.name} quantity increased`);
                                  } else {
                                    setAnnounce(`${item.name} added to cart`);
                                  }
                                  openCart();
                                }}
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    {items.length > SHOP_CATEGORY_PAGE_SIZE && (
                      <div className="table-pagination shop-category-pagination">
                        <span>
                          Page {currentPage + 1} of {pageCount}
                        </span>
                        <div className="table-pagination-controls">
                          <button
                            type="button"
                            onClick={() =>
                              setCategoryPages((prev) => ({
                                ...prev,
                                [id]: Math.max(0, (prev[id] ?? 0) - 1),
                              }))
                            }
                            disabled={currentPage === 0}
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCategoryPages((prev) => ({
                                ...prev,
                                [id]: Math.min(pageCount - 1, (prev[id] ?? 0) + 1),
                              }))
                            }
                            disabled={currentPage >= pageCount - 1}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="sr-only" aria-live="polite">
          {announce}
        </div>
      </main>

      {lightboxImage && (
        <div
          className="lightbox shop-lightbox"
          onClick={() => setLightboxImage(null)}
          style={{ "--shop-lightbox-bg": `url("${lightboxImage.background || lightboxImage.image}")` }}
        >
          <span
            className="lightbox-close"
            role="button"
            tabIndex={0}
            aria-label="Close image preview"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxImage(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setLightboxImage(null);
              }
            }}
          >
            <AppIcon icon={faTimes} />
          </span>
          <img
            src={lightboxImage.image}
            alt={`${lightboxImage.name} enlarged`}
            className="lightbox-img"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default Shop;
