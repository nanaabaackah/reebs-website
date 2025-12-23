import React, { useEffect, useState } from 'react';
//import rentalItems from "/src/data/rentalItems.json"
import { Link, useNavigate } from 'react-router-dom';
import './master.css';
import SideNav from '/src/components/SideNav';
import { useCart } from "/src/components/CartContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faShieldHeart, faTruckFast, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

const slugify = (value = "") =>
    value
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

const rentalPath = (item) => {
    const pageSlug = item?.page?.split("/").filter(Boolean).pop();
    const nameSlug = slugify(item?.name);
    return `/Rentals/${pageSlug || nameSlug || item?.id || ""}`;
};

const getCategory = (item = {}) => item.specificCategory || item.specificcategory || item.category || "Other";
const isContactPricing = (item = {}) => {
    const text = `${item.specificCategory || item.specificcategory || ""} ${item.category || ""} ${item.name || ""}`.toLowerCase(); 
    return (
        text.includes("bouncy") ||
        text.includes("castle") ||
        text.includes("package") ||
        text.includes("bundle") ||
        text.includes("deal")
    );
};

function Rentals() {
    const [rentals, setRentals] = useState([]);
    const { currency, setCurrency, convertPrice, formatCurrency } = useCart();
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [showSideNav, setShowSideNav] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const loadRentals = async () => {
            try {
                const res = await fetch("/.netlify/functions/inventory");
                if (res.ok) {
                    const data = await res.json();
                    const rentalItems = (Array.isArray(data) ? data : [])
                        .filter((item) => {
                            const source = (item.sourceCategoryCode || item.sourcecategorycode || "").toString().toLowerCase();
                            const isRental = source ? source === "rental" : (item.sku || "").toString().toUpperCase().startsWith("REN");
                            const isActive = (item.status ?? item.isActive) !== false;
                            return isRental && isActive;
                        });
                        
                    if (isMounted) {
                        setRentals(rentalItems);
                    }
                } else {
                    console.error("Failed to fetch rentals:", res.status);
                }
            } catch (err) {
                console.error("Error loading rentals:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadRentals();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        document.body.classList.add("rentals-theme");
        return () => document.body.classList.remove("rentals-theme");
    }, []);

    const filteredRentals = rentals.filter((item) => {
        const category = getCategory(item);
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "All" || category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const filteredCategories = Array.from(new Set(filteredRentals.map((item) => getCategory(item))));
    const groupedRentals = filteredCategories.map((category) => ({
        category,
        items: filteredRentals.filter((item) => getCategory(item) === category)
    }));

    // Track active section
    const [activeCategory, setActiveCategory] = useState(null);
    const allCategories = Array.from(new Set(rentals.map((item) => getCategory(item))));
    const categoryOptions = ["All", ...allCategories];
    const heroStats = [
        { label: "Rental items ready", value: rentals.length || "—" },
        { label: "Same-day in Accra", value: "Available" }
    ];

    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll(".rent-category-section");
            let current = "";
            sections.forEach((section) => {
                const sectionTop = section.offsetTop - 150;
                if (window.scrollY >= sectionTop) {
                    current = section.getAttribute("id");
                }
            });
            setActiveCategory(current);

            const grid = document.getElementById("rentals-grid");
            if (grid) {
                const showThreshold = grid.offsetTop - 140;
                setShowSideNav(window.scrollY >= showThreshold);
            }
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

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
                                <a className="hero-btn hero-btn-primary" href="#rentals-grid">Browse rentals</a>
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

            <section id='rentals-grid' className="rentals-section">
                <div className="rentals-main">
                    <SideNav
                        items={allCategories.map((category) => ({
                            id: category,
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

                        {groupedRentals.map(({ category, items }) => (
                            <div id={category} key={category} className="rent-category-section">
                                <div className="section-header rent-section-header">
                                    <p className="kicker">Category</p>
                                    <h2>{category}</h2>
                                </div>
                                <div className='rent-grid'>
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="rent-card glass-card"
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
                                            <div className="rent-image">
                                                <img src={item.image || item.imageUrl || "/imgs/placeholder.png"} alt={item.name}/>
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
                                                    <Link className="hero-btn hero-btn-link" to={rentalPath(item)} aria-label={`Explore more about ${item.name}`}>
                                                        Explore More
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
        </main>
    </div>
        </>
    );
}

export default Rentals;
