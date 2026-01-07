import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./master.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightLong, faTimes, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import AddToCartButton from "/src/components/AddToCartButton";
import CartOverlay from "/src/components/CartOverlay";
import CookieBanner from '/src/components/CookieBanner';
import { useCart } from "/src/components/CartContext";
import { useAuth } from "/src/components/AuthContext";

const SHOP_CACHE_KEY = "reebs_shop_inventory_v1";
const SHOP_CACHE_TTL = 5 * 60 * 1000;

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

function Shop() {
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [popularIndex, setPopularIndex] = useState(0);
  const [announce, setAnnounce] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 12;
  const gridRef = React.useRef(null);

  const { isAuthenticated, authReady } = useAuth();

  const { currency, setCurrency, convertPrice, formatCurrency, rates } = useCart();
  const getPrice = (item) =>
    item.price ?? (typeof item.priceCents === "number" ? item.priceCents / 100 : undefined);
  const getQuantity = (item) => item.quantity ?? item.stock ?? 0;
  const getCategoryLabel = (item) =>
    item.specificCategory || item.specificcategory || item.type || "Other";
  const categories = React.useMemo(
    () => Array.from(new Set(inventory.map((item) => getCategoryLabel(item)))),
    [inventory]
  );
  const popularCurrencies = ["USD", "GBP", "EUR", "CAD", "NGN"];
  const ratesAvailable = rates && Object.keys(rates || {}).length > 1;

  const getStatusValue = (item) => {
    if (typeof item?.status === "string") return item.status.toLowerCase();
    if (item?.status === false) return "unavailable";
    if (item?.isActive === false) return "unavailable";
    return "available";
  };

  const isSoldOutItem = (item) =>
    getStatusValue(item) === "unavailable" || getQuantity(item) === 0;

  const hasRealImage = (item) => {
    const src = item?.image || item?.imageUrl || "";
    if (!src) return false;
    return !src.includes("placeholder");
  };

  const applyAvailabilitySort = (list) => {
    const filtered = inStockOnly ? list.filter((item) => !isSoldOutItem(item)) : list;
    return [...filtered].sort((a, b) => {
      const aHasImage = hasRealImage(a);
      const bHasImage = hasRealImage(b);
      if (aHasImage !== bHasImage) return aHasImage ? -1 : 1;

      const aSold = isSoldOutItem(a);
      const bSold = isSoldOutItem(b);
      if (aSold === bSold) return 0;
      return aSold ? 1 : -1; // push sold-out to the end
    });
  };

  // --- Fetch Inventory ---
  useEffect(() => {
    let isMounted = true;
    if (!authReady) return () => {
      isMounted = false;
    };
    if (!isAuthenticated) {
      if (isMounted) {
        setInventory([]);
        setLoading(false);
      }
      return () => {
        isMounted = false;
      };
    }

    const cached = readShopCache();
    if (cached?.length) {
      setInventory(cached);
    }
    setLoading(!cached);

    const controller = new AbortController();
    fetch("/.netlify/functions/inventory", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const productsOnly = (Array.isArray(data) ? data : []).filter((item) => {
          const source = (item.sourceCategoryCode || item.sourcecategorycode || "").toString().toLowerCase();
          if (!source) return true;
          return source !== "rental";
        });
        if (!isMounted) return;
        setInventory(productsOnly);
        writeShopCache(productsOnly);
        setLoading(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        console.error("❌ Error fetching inventory:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [authReady, isAuthenticated]);

  // Apply shop theme on mount
  useEffect(() => {
    document.body.classList.add("shop-theme");
    return () => document.body.classList.remove("shop-theme");
  }, []);

  // Debounce search for smoother queries
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const popularItems = React.useMemo(() => {
    const popular = [...inventory]
      .filter((item) => getQuantity(item) > 0)
      .sort((a, b) => getQuantity(b) - getQuantity(a))
      .slice(0, 6);
    return popular.length ? popular : inventory.slice(0, 6);
  }, [inventory]);

  useEffect(() => {
    if (!popularItems.length) return;
    setPopularIndex(0);
  }, [popularItems]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, categoryFilter, inStockOnly, inventory.length]);

  const filteredProducts = React.useMemo(() => {
    const baseFiltered = inventory.filter(
      (item) => categoryFilter === "All" || getCategoryLabel(item) === categoryFilter
    );

    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    const localMatches = (list) =>
      list.filter((item) => {
        const name = (item?.name || "").toString().toLowerCase();
        const description = (item?.description || "").toString().toLowerCase();
        const category = getCategoryLabel(item).toString().toLowerCase();
        return (
          name.includes(normalizedQuery) ||
          description.includes(normalizedQuery) ||
          category.includes(normalizedQuery)
        );
      });

    if (!normalizedQuery) {
      return applyAvailabilitySort(baseFiltered);
    }

    const fallbackMatches = localMatches(baseFiltered);
    return applyAvailabilitySort(fallbackMatches);
  }, [debouncedQuery, categoryFilter, inventory, inStockOnly]);

  const pageCount = React.useMemo(
    () => Math.max(1, Math.ceil(filteredProducts.length / pageSize)),
    [filteredProducts.length, pageSize]
  );
  const clampedPage = Math.min(page, pageCount - 1);
  const paginatedProducts = React.useMemo(() => {
    const start = clampedPage * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, clampedPage, pageSize]);

  useEffect(() => {
    const gridEl = gridRef.current;
    if (gridEl && typeof gridEl.scrollIntoView === "function") {
      gridEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [clampedPage]);

  useEffect(() => {
    if (!popularItems.length) return;
    const id = setInterval(() => {
      setPopularIndex((prev) => (prev + 1) % popularItems.length);
    }, 4500);
    return () => clearInterval(id);
  }, [popularItems]);

  if (loading) return (
    <div className="shop-skeleton">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div key={idx} className="shop-card skeleton">
          <div className="shop-image" />
          <div className="shop-details">
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <CookieBanner />
      <main className="shop-page" role="main" id="main">
        <section id="r3-intro" className="shop-hero">
          <div className="shop-hero-copy">
            <h1>Shop</h1>
            <p className="shop-sub">
              Party supplies, stationary, house supplieess, toys, decor, and all the little delights that make
              celebrations feel magical.
            </p>
            <div className="shop-hero-actions">
              {isAuthenticated ? (
                <button
                  className="shop-cart-btn hero-btn hero-btn-primary"
                  onClick={() => setCartOpen(true)}
                >
                  View cart
                </button>
              ) : (
                <Link className="hero-btn hero-btn-primary" to="/login">
                  Staff login
                </Link>
              )}
              <Link className="hero-btn hero-btn-ghost" to="/rentals">
                Browse rentals
              </Link>
            </div>
          </div>
          <div className="shop-hero-visual">
              <div className="shop-rates">
                <div className="shop-rates-header">
                  <span>Daily currency rates → GHS</span>
                  <small>{ratesAvailable ? "Auto-updated" : "Rates unavailable"}</small>
                </div>
              <div className="shop-rates-grid">
                {popularCurrencies.map((cur) => {
                  const rate = rates?.[cur];
                  const toGhs =
                    rate && rate !== 0 ? (1 / rate).toFixed(2) : null;
                  return (
                    <div key={cur} className="shop-rate">
                      <span className="shop-rate-label">1 {cur}</span>
                      <span className="shop-rate-value">
                        {toGhs ? `${toGhs} GHS` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {!isAuthenticated && (
          <section className="construction-banner glass-card" aria-live="polite">
            <p className="kicker-small">Under construction</p>
            <h2>Shop is getting a refresh</h2>
            <p>Catalog browsing is available to logged-in staff only right now.</p>
          </section>
        )}

        {isAuthenticated && (
          <>
            <section id="r3-shop-grid" className="relative overflow-visible">
              <div className="shop-container">
                <div className="shop-panel">
                  <div className="shop-controls">
                    <div className="search-wrapper">
                      <input
                        type="text"
                        placeholder="Search bubbles, balloons, pinatas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-bar"
                        aria-label="Search products"
                      />
                    </div>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="currency-selector"
                      aria-label="Select currency"
                    >
                      {["GHS", "USD", "CAD", "GBP", "EUR", "NGN"].map((cur) => (
                        <option key={cur} value={cur}>
                          {cur}
                        </option>
                      ))}
                    </select>
                    <label className="availability-filter">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                      />
                      In stock only
                    </label>
                  </div>

                  <div className="filter-chips">
                    <button
                      className={`filter-chip ${categoryFilter === "All" ? "active" : ""}`}
                      onClick={() => setCategoryFilter("All")}
                    >
                      All
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        className={`filter-chip ${categoryFilter === cat ? "active" : ""}`}
                        onClick={() => setCategoryFilter(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="shop-meta-row">
                    <nav className="breadcrumb">
                      <Link to="/">Home</Link>{" "}
                      <FontAwesomeIcon icon={faArrowRightLong} />{"  "}
                      <span
                        onClick={() => setCategoryFilter("All")}
                        className="breadcrumb-link"
                      >
                        Shop
                      </span>
                      {categoryFilter !== "All" && (
                        <>
                          {" "}
                          &gt; <span>{categoryFilter}</span>
                        </>
                      )}
                    </nav>
                    <span className="shop-results">
                      {filteredProducts.length === 0
                        ? "No items to show"
                        : `Showing ${clampedPage * pageSize + 1}-${Math.min(
                            filteredProducts.length,
                            (clampedPage + 1) * pageSize
                          )} of ${filteredProducts.length} items`}
                    </span>
                  </div>
                </div>

                <div className="shop-grid" ref={gridRef}>
                  {paginatedProducts.map((item) => {
                    const fallbackDescription =
                      item.description ||
                      "Playful, durable, and party-ready.";
                    const isExpanded = expandedProduct === item.id;
                    const isUnavailable = getStatusValue(item) === "unavailable";
                    const isSoldOut = isSoldOutItem(item);
                    const cardClassName = [
                      "shop-card",
                      isExpanded ? "expanded" : "",
                      isSoldOut ? "sold-out" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <div
                        key={item.id}
                        className={cardClassName}
                      >
                        <div
                          className="shop-image"
                          onClick={() => setLightboxImage(item.image || item.imageUrl || null)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setLightboxImage(item.image || item.imageUrl || null);
                            }
                          }}
                        >
                          <img
                            src={item.image || item.imageUrl || "/imgs/placeholder.png"}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                          />
                          {isSoldOut && (
                            <span className="shop-out-banner">Out of stock</span>
                          )}
                          <span className="shop-zoom" aria-hidden="true">
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                          </span>
                        </div>
                        <div className="shop-details">
                          <div className="shop-price-row">
                            <p className="price">
                              {formatCurrency(convertPrice(getPrice(item) || 0))}
                            </p>
                          </div>
                          <div className="shop-pill">{item.specificCategory || item.specificcategory}</div>
                          <h3>{item.name}</h3>
                          <p className="stock">
                            {isSoldOut ? "Unavailable" : `${getQuantity(item)} left in stock`}
                          </p>
                          <AddToCartButton
                            item={{ ...item, quantity: getQuantity(item) }}
                            onAdded={() => {
                              setAnnounce(`${item.name} added to cart`);
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <p className="no-results">
                      No items match your search — try a different term or reset the
                      filters.
                    </p>
                  )}
                </div>

                {filteredProducts.length > pageSize && (
                  <div className="table-pagination shop-pagination">
                    <span>
                      Page {clampedPage + 1} of {pageCount}
                    </span>
                    <div className="table-pagination-controls">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={clampedPage === 0}
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                        disabled={clampedPage >= pageCount - 1}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                <hr className="shop-separator" />

                <section className="shop-popular">
                  <div className="shop-popular-header">
                    <div>
                      <p className="kicker-small">Most popular</p>
                      <h3>Fan-favorite picks</h3>
                      <p className="shop-popular-sub">
                        A quick rotation of items guests keep coming back for.
                      </p>
                    </div>
                    <div className="shop-popular-controls">
                      <button
                        onClick={() =>
                          setPopularIndex(
                            (popularIndex - 1 + popularItems.length) %
                              popularItems.length
                          )
                        }
                        aria-label="Previous popular item"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() =>
                          setPopularIndex((popularIndex + 1) % popularItems.length)
                        }
                        aria-label="Next popular item"
                      >
                        ›
                      </button>
                    </div>
                  </div>

                  {popularItems.length > 0 && (
                    <div
                      className="shop-popular-card"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowRight") {
                          setPopularIndex((popularIndex + 1) % popularItems.length);
                        } else if (e.key === "ArrowLeft") {
                          setPopularIndex(
                            (popularIndex - 1 + popularItems.length) %
                              popularItems.length
                          );
                        }
                      }}
                      aria-label={`Popular item: ${popularItems[popularIndex].name}`}
                    >
                      <div className="popular-img">
                        <img
                          src={
                            popularItems[popularIndex].image ||
                            popularItems[popularIndex].imageUrl ||
                            "/imgs/placeholder.png"
                          }
                          alt={popularItems[popularIndex].name}
                          loading="lazy"
                          decoding="async"
                        />
                        {getQuantity(popularItems[popularIndex]) === 0 && (
                          <span className="shop-ribbon">Sold out</span>
                        )}
                      </div>
                      <div className="popular-details">
                        <span className="shop-pill">
                          {popularItems[popularIndex].specificCategory || popularItems[popularIndex].specificcategory}
                        </span>
                        <h4>{popularItems[popularIndex].name}</h4>
                        <p className="price">
                          {formatCurrency(
                            convertPrice(getPrice(popularItems[popularIndex]) || 0)
                          )}
                        </p>
                        <p className="popular-stock">
                          {getQuantity(popularItems[popularIndex])} in stock
                        </p>
                        <AddToCartButton
                          item={{ ...popularItems[popularIndex], quantity: getQuantity(popularItems[popularIndex]) }}
                          onAdded={() => {
                            setAnnounce(`${popularItems[popularIndex].name} added to cart`);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </section>

            <div className="sr-only" aria-live="polite">
              {announce}
            </div>
          </>
        )}
      </main>

      {isAuthenticated && lightboxImage && (
        <div className="lightbox" onClick={() => setLightboxImage(null)}>
          <span className="lightbox-close">
            <FontAwesomeIcon icon={faTimes} />
          </span>
          <img
            src={lightboxImage}
            alt="Enlarged product"
            className="lightbox-img"
          />
        </div>
      )}

      {isAuthenticated && (
        <CartOverlay open={cartOpen} onClose={() => setCartOpen(false)} />
      )}
    </>
  );
}

export default Shop;
