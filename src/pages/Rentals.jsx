import React, { useEffect, useMemo, useState } from 'react';
//import rentalItems from "/src/data/rentalItems.json"
import { Link, useNavigate } from 'react-router-dom';
import './master.css';
import SideNav from '/src/components/SideNav';
import { useCart } from "/src/components/CartContext";
import { useAuth } from "/src/components/AuthContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faShieldHeart, faTruckFast, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

const slugify = (value = "") =>
    value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

const CATEGORY_ORDER = ["Kid's Party Rentals", "Indoor Games", "Machines", "Bouncy Castles"];
const RENTALS_CACHE_KEY = "reebs_rentals_cache_v1";
const RENTALS_CACHE_TTL = 5 * 60 * 1000;

const readRentalsCache = () => {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.sessionStorage.getItem(RENTALS_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.items || !parsed?.ts) return null;
        if (Date.now() - parsed.ts > RENTALS_CACHE_TTL) return null;
        return parsed.items;
    } catch {
        return null;
    }
};

const writeRentalsCache = (items) => {
    if (typeof window === "undefined") return;
    try {
        window.sessionStorage.setItem(
            RENTALS_CACHE_KEY,
            JSON.stringify({ ts: Date.now(), items })
        );
    } catch {
        // ignore cache write failures
    }
};

const sortCategories = (a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a);
    const bIndex = CATEGORY_ORDER.indexOf(b);
    const aRank = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
    const bRank = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
    if (aRank !== bRank) return aRank - bRank;
    return a.localeCompare(b);
};

const rentalPath = (item) => {
    const pageSlug = item?.page?.split("/").filter(Boolean).pop();
    const nameSlug = slugify(item?.name);
    return `/Rentals/${pageSlug || nameSlug || item?.id || ""}`;
};

const normalizeCategory = (value) => {
    const raw = (value || "").toString().trim();
    const lowered = raw.toLowerCase();
    if (!raw) return "Other";
    if (lowered.includes("bouncy")) return "Bouncy Castles";
    if (lowered.includes("machine") || lowered.includes("popcorn") || lowered.includes("snow cone") || lowered.includes("snowcone") || lowered.includes("cotton candy")) {
        return "Machines";
    }
    if (lowered.includes("indoor") || lowered.includes("board game") || lowered.includes("jenga")) {
        return "Indoor Games";
    }
    return raw;
};

const isKidsPartyMachine = (item = {}) => {
    const name = `${item?.name || ""}`.toLowerCase();
    return (
        name.includes("popcorn") ||
        name.includes("snow cone") ||
        name.includes("snowcone") ||
        name.includes("cotton candy")
    );
};

const getCategory = (item = {}) => {
    if (isKidsPartyMachine(item)) return "Kid's Party Rentals";
    return normalizeCategory(item.specificCategory || item.specificcategory || item.category || "Other");
};
const isKnownRentalCategory = (item = {}) => {
    const category = getCategory(item);
    if (!category) return false;
    if (["Machines", "Indoor Games", "Bouncy Castles"].includes(category)) return true;
    return category.toLowerCase().includes("rental");
};
const isCategoryStub = (item = {}) => {
    const nameSlug = slugify(item?.name);
    return [
        "bouncy-castle",
        "bouncy-castles",
        "indoor-games",
        "indoor-game",
        "indoor-board-games"
    ].includes(nameSlug);
};
const shouldExcludeFromRentals = (item = {}) => {
    const source = (item.sourceCategoryCode || item.sourcecategorycode || "").toString().toLowerCase();
    if (source === "water") return true;
    const category = getCategory(item);
    if (category.toLowerCase() === "party supplies") return true;
    if (category !== "Machines") return false;
    const name = `${item?.name || ""}`.toLowerCase();
    return (
        name.includes("air blower") ||
        name.includes("air-blower") ||
        name.includes("airblower") ||
        name.includes("blower pump")
    );
};
const isContactPricing = (item = {}) => {
    const text = `${item.specificCategory || item.specificcategory || ""} ${item.category || ""} ${item.name || ""}`.toLowerCase(); 
    return (
        text.includes("package") ||
        text.includes("bundle") ||
        text.includes("deal")
    );
};

const uniqueByKey = (items = []) => {
    const unique = new Map();
    for (const item of items) {
        const key = item.productId || item.id || `${slugify(item.name)}-${getCategory(item)}`;
        if (!unique.has(key)) {
            unique.set(key, item);
        }
    }
    return Array.from(unique.values());
};

function Rentals() {
    const [rentals, setRentals] = useState([]);
    const { currency, setCurrency, convertPrice, formatCurrency } = useCart();
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [showSideNav, setShowSideNav] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated, authReady } = useAuth();

    useEffect(() => {
        let isMounted = true;
        if (!authReady) return () => {
            isMounted = false;
        };
        if (!isAuthenticated) {
            if (isMounted) {
                setRentals([]);
                setLoading(false);
            }
            return () => {
                isMounted = false;
            };
        }

        const controller = new AbortController();
        const loadRentals = async () => {
            const cached = readRentalsCache();
            if (cached?.length) {
                setRentals(cached);
            }
            setLoading(!cached);
            try {
                const inventoryPromise = fetch("/.netlify/functions/inventory", { signal: controller.signal });
                const indoorPromise = fetch("/.netlify/functions/indoor_games", { signal: controller.signal });
                const bouncyPromise = fetch("/.netlify/functions/bouncy_castles", { signal: controller.signal });
                const machinesPromise = fetch("/.netlify/functions/machines", { signal: controller.signal });

                const inventoryRes = await inventoryPromise;

                if (!inventoryRes.ok) {
                    console.error("Failed to fetch rentals:", inventoryRes.status);
                }

                const inventoryData = inventoryRes.ok ? await inventoryRes.json() : [];

                const rentalItems = (Array.isArray(inventoryData) ? inventoryData : [])
                    .filter((item) => {
                        const source = (item.sourceCategoryCode || item.sourcecategorycode || "").toString().toLowerCase();
                        const isRental = source
                            ? source === "rental"
                            : (item.sku || "").toString().toUpperCase().startsWith("REN") || isKnownRentalCategory(item);
                        const isActive = (item.status ?? item.isActive) !== false;
                        return isRental && isActive;
                    });

                const baseCombined = rentalItems.filter(
                    (item) => !isCategoryStub(item) && !shouldExcludeFromRentals(item)
                );
                if (isMounted) {
                    setRentals(uniqueByKey(baseCombined));
                    setLoading(false);
                }

                const safeJson = async (result, label) => {
                    if (!result || result.status !== "fulfilled") return [];
                    const response = result.value;
                    if (!response.ok) {
                        console.error(`Failed to fetch ${label}:`, response.status);
                        return [];
                    }
                    try {
                        return await response.json();
                    } catch (err) {
                        console.error(`Failed to parse ${label} response`, err);
                        return [];
                    }
                };

                const [indoorResult, bouncyResult, machinesResult] = await Promise.allSettled([
                    indoorPromise,
                    bouncyPromise,
                    machinesPromise,
                ]);

                const [indoorData, bouncyData, machinesData] = await Promise.all([
                    safeJson(indoorResult, "indoor games"),
                    safeJson(bouncyResult, "bouncy castles"),
                    safeJson(machinesResult, "machines"),
                ]);

                const indoorItems = (Array.isArray(indoorData) ? indoorData : []).map((item) => ({
                    ...item,
                    sourceCategoryCode: "RENTAL",
                    specificCategory: "Indoor Games",
                    imageUrl: item.image,
                    rate: item.rate || "per day",
                    price: typeof item.price === "number" ? item.price / 100 : item.price,
                }));

                const bouncyItems = (Array.isArray(bouncyData) ? bouncyData : []).map((item) => ({
                    ...item,
                    sourceCategoryCode: "RENTAL",
                    specificCategory: "Bouncy Castles",
                    imageUrl: item.image,
                    page: `/Rentals/${slugify(item.name)}`,
                    price: item.priceRange || item.price,
                    rate: item.rate || "per day",
                }));

                const machineItems = (Array.isArray(machinesData) ? machinesData : []).map((item) => ({
                    ...item,
                    id: item.productId || item.id,
                    sourceCategoryCode: "RENTAL",
                    specificCategory: "Machines",
                    imageUrl: item.image,
                    rate: item.rate || "per day",
                    price: typeof item.price === "number" ? item.price / 100 : item.price,
                }));

                const combined = [...rentalItems, ...machineItems, ...indoorItems, ...bouncyItems]
                    .filter((item) => !isCategoryStub(item) && !shouldExcludeFromRentals(item));
                const merged = uniqueByKey(combined);

                if (isMounted) {
                    setRentals(merged);
                    writeRentalsCache(merged);
                }
            } catch (err) {
                if (err?.name !== "AbortError") {
                    console.error("Error loading rentals:", err);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadRentals();
        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [authReady, isAuthenticated]);

    useEffect(() => {
        document.body.classList.add("rentals-theme");
        return () => document.body.classList.remove("rentals-theme");
    }, []);

    const filteredRentals = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        return rentals.filter((item) => {
            const category = getCategory(item);
            const name = (item?.name || "").toString().toLowerCase();
            const matchesSearch = !normalizedQuery || name.includes(normalizedQuery);
            const matchesCategory = categoryFilter === "All" || category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [rentals, searchQuery, categoryFilter]);

    const groupedRentals = useMemo(() => {
        const grouped = new Map();
        for (const item of filteredRentals) {
            const category = getCategory(item);
            if (!grouped.has(category)) {
                grouped.set(category, []);
            }
            grouped.get(category).push(item);
        }
        const categories = Array.from(grouped.keys()).sort(sortCategories);
        return categories.map((category) => ({
            category,
            id: slugify(category),
            items: grouped.get(category),
        }));
    }, [filteredRentals]);

    // Track active section
    const [activeCategory, setActiveCategory] = useState(null);
    const allCategories = useMemo(() => {
        const categories = new Set();
        for (const item of rentals) {
            categories.add(getCategory(item));
        }
        return Array.from(categories).sort(sortCategories);
    }, [rentals]);
    const categoryOptions = useMemo(() => ["All", ...allCategories], [allCategories]);
    const heroStats = useMemo(
        () => [
            { label: "Rental items ready", value: rentals.length || "—" },
            { label: "Same-day in Accra", value: "Available" },
        ],
        [rentals.length]
    );

    useEffect(() => {
        const sections = Array.from(document.querySelectorAll(".rent-category-section"));
        let ticking = false;
        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            window.requestAnimationFrame(() => {
                let current = "";
                sections.forEach((section) => {
                    const sectionTop = section.offsetTop - 150;
                    if (window.scrollY >= sectionTop) {
                        current = section.getAttribute("id") || "";
                    }
                });
                setActiveCategory((prev) => (prev === current ? prev : current));

                const grid = document.getElementById("rentals-grid");
                if (grid) {
                    const showThreshold = grid.offsetTop - 140;
                    const shouldShow = window.scrollY >= showThreshold;
                    setShowSideNav((prev) => (prev === shouldShow ? prev : shouldShow));
                }
                ticking = false;
            });
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [groupedRentals]);

    if (loading) return (
        <div className="loader">
        <img
            src="/imgs/reebs.gif"
            alt="Loading content..."
            className="loader-gif"
        />
        </div>
    );

    return (
        <>
            <a href="#main" className="skip-link">Skip to main content</a>
            <div className="rentals-page" id="main" role="main">
                <main className="rentals-shell">
                    <section id='rentals-intro' className="rentals-hero" aria-labelledby="rentals-hero-heading">
                        <div className="rentals-hero-copy">
                            <h1 id="rentals-hero-heading">Party rentals styled the REEBS way</h1>
                            <p className="hero-sub rentals-sub">
                                Bounce houses, decor, concessions, and full setup help. We prep, deliver, and style so you can enjoy the celebration.
                            </p>
                            <div className="rentals-pill-row" aria-label="Rental highlights">
                                <span className="rentals-pill">
                                    <FontAwesomeIcon icon={faWandMagicSparkles} aria-hidden="true" />
                                    Styled setups
                                </span>
                                <span className="rentals-pill">
                                    <FontAwesomeIcon icon={faShieldHeart} aria-hidden="true" />
                                    Cleaned + kid-safe
                                </span>
                                <span className="rentals-pill">
                                    <FontAwesomeIcon icon={faTruckFast} aria-hidden="true" />
                                    Delivery & pickup
                                </span>
                            </div>
                            <div className="hero-ctas">
                                {isAuthenticated ? (
                                    <a className="hero-btn hero-btn-primary" href="#rentals-grid">Browse rentals</a>
                                ) : (
                                    <Link className="hero-btn hero-btn-primary" to="/login">Staff login</Link>
                                )}
                                <Link className="hero-btn hero-btn-ghost" to="/contact">Book a setup</Link>
                            </div>
                            <div className="hero-stats rentals-stats" aria-label="Rental stats">
                        {heroStats.map((stat) => (
                            <div key={stat.label}>
                                <strong>{stat.value}</strong>
                                <span>{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {!isAuthenticated && (
                <section className="construction-banner glass-card" aria-live="polite">
                    <p className="kicker-small">Under construction</p>
                    <h2>Rentals are being updated</h2>
                    <p>Full browsing is available to logged-in staff only right now.</p>
                </section>
            )}

            {isAuthenticated && (
                <section id='rentals-grid' className="rentals-section">
                    <div className="rentals-main">
                        <SideNav
                            items={allCategories.map((category) => ({
                                id: slugify(category),
                                label: category,
                            }))}
                            activeId={activeCategory}
                            label="Rental categories"
                            className={`rentals-side-menu ${showSideNav ? "is-visible" : "is-hidden"}`}
                        />

                        <div className="rentals-main-content">
                            <div className="rentals-toolbar glass-card">
                                <div className="rentals-toolbar-head">
                                    <div>
                                        <p className="rentals-meta">
                                            {filteredRentals.length} items shown · {allCategories.length} categories
                                        </p>
                                    </div>
                                    <div className="rentals-toolbar-actions">
                                        <label htmlFor="currencySelector" className="sr-only">Select currency</label>
                                        <select
                                            value={currency}
                                            onChange={(e) => setCurrency(e.target.value)}
                                            className="currency-selector"
                                            id="currencySelector"
                                        >
                                            {["GHS", "USD", "CAD", "GBP", "EUR", "NGN"].map((cur) => (
                                                <option key={cur} value={cur}>
                                                    {cur}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="rentals-controls">
                                    <div className="search-wrapper rentals-search">
                                        <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" aria-hidden="true" />
                                        <input
                                            type="text"
                                            placeholder="Search bounce houses, decor, concessions..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="search-bar"
                                            aria-label="Search rental items"
                                        />
                                    </div>
                                </div>

                                <div className="filter-chips" role="list" aria-label="Quick category filters">
                                    {categoryOptions.map((cat) => (
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
                            </div>

                            {groupedRentals.length === 0 && (
                                <div className="rentals-empty glass-card">
                                    <p>No rentals match that search. Try a different keyword or reset filters.</p>
                                    <button className="hero-btn hero-btn-link" type="button" onClick={() => {
                                        setSearchQuery("");
                                        setCategoryFilter("All");
                                    }}>
                                        Reset filters
                                    </button>
                                </div>
                            )}

                            {groupedRentals.map(({ category, id, items }) => (
                                <div id={id} key={id} className="rent-category-section">
                                    <div className="section-header rent-section-header">
                                        <p className="kicker">Category</p>
                                        <h2>{category}</h2>
                                    </div>
                                    <div className='rent-grid'>
                                        {items.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`rent-card glass-card ${getCategory(item) === "Indoor Games" ? "rent-card-indoor" : ""}`}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => navigate(rentalPath(item))}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        navigate(rentalPath(item));
                                                    }
                                                }}
                                            >
                                                <div className={`rent-image ${getCategory(item) === "Indoor Games" ? "rent-image-indoor" : ""}`}>
                                                    <img
                                                        src={item.image || item.imageUrl || "/imgs/placeholder.png"}
                                                        alt={item.name}
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                    <span className="rent-tag">{item.specificCategory || item.specificcategory || item.category}</span>
                                                </div>
                                                <div className="rent-details">
                                                    <div className="rent-title-row">
                                                        <h3>{item.name}</h3>
                                                    </div>
                                                    <p className="price">
                                                        {(() => {
                                                            const priceValue = item.price ?? (typeof item.priceCents === "number" ? item.priceCents / 100 : undefined);
                                                            // Bouncy castles and package deals are quoted per request
                                                            if (isContactPricing(item)) return "Contact us for pricing";
                                                            // Handle special “contact for info” item
                                                            if (item.id === 8) return "Contact for more info.";

                                                            // Handle missing price
                                                            if (!priceValue || priceValue === "0" || priceValue === 0) {
                                                            return "Contact for price";
                                                            }

                                                            // Handle price ranges (e.g., "20-40")
                                                            if (typeof priceValue === "string" && priceValue.includes("-")) {
                                                            const [min, max] = priceValue.split("-").map(Number);
                                                            return `${formatCurrency(convertPrice(min))} - ${formatCurrency(convertPrice(max))} ${item.rate}`;
                                                            }

                                                            // Default fixed price
                                                            return `${formatCurrency(convertPrice(Number(priceValue)))} ${item.rate}`;
                                                        })()}
                                                    </p>

                                                    <div className="rent-actions">
                                                        <Link className="hero-btn hero-btn-link" to={rentalPath(item)} aria-label={`View ${item.name}`}>
                                                            View
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </main>
    </div>
        </>
    );
}

export default Rentals;
