import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./master.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightLong, faTimes, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import AddToCartButton from "/src/components/AddToCartButton";
import CartOverlay from "/src/components/CartOverlay";
import CookieBanner from '/src/components/CookieBanner';
import { useCart } from "/src/components/CartContext";

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

  const [aiSearching, setAiSearching] = useState(false);
  const [aiEnabled] = useState(true);

  const { currency, setCurrency, convertPrice, formatCurrency, rates } = useCart();
  const getPrice = (item) =>
    item.price ?? (typeof item.priceCents === "number" ? item.priceCents / 100 : undefined);
  const getQuantity = (item) => item.stock ?? item.quantity ?? 0;
  const categories = Array.from(
    new Set(inventory.map((item) => item.specificCategory || item.type || "Other"))
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

  const applyAvailabilitySort = (list) => {
    const filtered = inStockOnly ? list.filter((item) => !isSoldOutItem(item)) : list;
    return [...filtered].sort((a, b) => {
      const aSold = isSoldOutItem(a);
      const bSold = isSoldOutItem(b);
      if (aSold === bSold) return 0;
      return aSold ? 1 : -1; // push sold-out to the end
    });
  };

  // --- Fetch Inventory ---
  useEffect(() => {
    fetch("/.netlify/functions/inventory")
      .then((res) => res.json())
      .then((data) => {
        const productsOnly = (Array.isArray(data) ? data : []).filter((item) => {
          const source = (item.sourceCategoryCode || "").toLowerCase();
          const isInventory = source ? source === "inventory" : true;
          return isInventory;
        });
        setInventory(productsOnly);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching inventory:", err);
        setLoading(false);
      });
  }, []);

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

  const [filteredProducts, setFilteredProducts] = useState([]);
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
    if (!popularItems.length) return;
    const id = setInterval(() => {
      setPopularIndex((prev) => (prev + 1) % popularItems.length);
    }, 4500);
    return () => clearInterval(id);
  }, [popularItems]);

  useEffect(() => {
    const baseFiltered = inventory.filter(
      (item) => categoryFilter === "All" || item.specificCategory === categoryFilter
    );

    if (debouncedQuery.trim() === "") {
      setFilteredProducts(applyAvailabilitySort(baseFiltered));
      setAiSearching(false);
      return;
    }
    if (!aiEnabled) {
      const result = baseFiltered.filter((item) => {
        const matchesSearch = item.name
          .toLowerCase()
          .includes(debouncedQuery.toLowerCase());
        return matchesSearch;
      });
      setFilteredProducts(applyAvailabilitySort(result));
    } else if (debouncedQuery.trim().length > 3) {
      setAiSearching(true);
      fetch("/.netlify/functions/aiSearch", {
        method: "POST",
        body: JSON.stringify({ query: debouncedQuery, inventory }),
      })
        .then((res) => res.json())
        .then((data) => {
          const aiMatches = inventory.filter((item) =>
            data.matches?.includes(item.id)
          );
          const aiScoped =
            categoryFilter === "All"
              ? aiMatches
              : aiMatches.filter((item) => item.specificCategory === categoryFilter);
          setFilteredProducts(applyAvailabilitySort(aiScoped));
        })
        .catch((err) => console.error("AI search failed:", err))
        .finally(() => setAiSearching(false));
    } else {
      setFilteredProducts(applyAvailabilitySort(baseFiltered));
      setAiSearching(false);
    }
  }, [debouncedQuery, categoryFilter, inventory, aiEnabled, inStockOnly]);

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
            {/*<div className="shop-hero-meta">
              <span>{inventory.length} items</span>
              <span>{categories.length || 0} categories</span>
              <span className="ai-chip">
                {aiSearching ? "AI is looking…" : "✨ AI-assisted search"}
              </span>
            </div>*/}
            <div className="shop-hero-actions">
              <button
                className="shop-cart-btn hero-btn hero-btn-primary"
                onClick={() => setCartOpen(true)}
              >
                View cart
              </button>
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
                    className="search-bar ai-enabled"
                    aria-label="Search products"
                  />
                  <span
                    className={`ai-icon ${aiSearching ? "ai-loading" : ""}`}
                    title="Powered by AI"
                  >
                    {aiSearching ? "🤖..." : "✨AI"}
                  </span>
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="category-filter"
                  aria-label="Filter by category"
                >
                  <option value="All">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

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
                {categories.slice(0, 5).map((cat) => (
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
                  Showing {filteredProducts.length} of {inventory.length} items
                </span>
              </div>
            </div>

            <div className="shop-grid">
              {filteredProducts.map((item) => {
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
                      onClick={() => setLightboxImage(item.imageUrl)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setLightboxImage(item.imageUrl);
                        }
                      }}
                    >
                      <img
                        src={item.imageUrl || "/imgs/placeholder.png"}
                        alt={item.name}
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
                      <div className="shop-pill">{item.specificCategory}</div>
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
                        popularItems[popularIndex].imageUrl ||
                        "/imgs/placeholder.png"
                      }
                      alt={popularItems[popularIndex].name}
                    />
                    {getQuantity(popularItems[popularIndex]) === 0 && (
                      <span className="shop-ribbon">Sold out</span>
                    )}
                  </div>
                  <div className="popular-details">
                    <span className="shop-pill">
                      {popularItems[popularIndex].specificCategory}
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
      </main>

      {lightboxImage && (
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

      <CartOverlay open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}

export default Shop;
