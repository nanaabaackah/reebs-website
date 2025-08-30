import React, { useEffect, useState } from "react";
import shopItems from "/src/data/shopItems.json"
import { Link } from 'react-router-dom';
import './master.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightLong, faShoppingCart, faTimes } from '@fortawesome/free-solid-svg-icons';

function Shop() {
    const [currency, setCurrency] = useState("GHS");
    const [rates, setRates] = useState({});
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");

    const [lightboxImage, setLightboxImage] = useState(null);
    const [cart, setCart] = useState([]);
    const apiKey = import.meta.env.VITE_CURRENCY_API_KEY;

    const addToCart = (item) => {
        setCart([...cart, item]);
    };

    useEffect(() => {
        async function fetchRates() {
            try {
                const response = await fetch(
                    `https://v6.exchangerate-api.com/v6/${apiKey}/latest/GHS`
                );
                const data = await response.json();

                if (data.result === "success") {
                    setRates(data.conversion_rates);

                    // Detect user region for default currency
                    const region = navigator.language.split("-")[1];
                    let defaultCurrency = "GHS";
                    if (region === "US") defaultCurrency = "USD";
                    else if (region === "GB") defaultCurrency = "GBP";
                    else if (region === "CA") defaultCurrency = "CAD";
                    else if (["DE","FR","ES","IT","NL","BE","PT","FI","IE"].includes(region)) defaultCurrency = "EUR";

                    setCurrency(defaultCurrency);
                } else {
                    console.error("Error fetching rates:", data["error-type"]);
                }

                setLoading(false);
            } catch (error) {
                console.error("Error fetching rates:", error);
                setLoading(false);
            }
        }
        fetchRates();
    }, [apiKey]);

    function convertPrice(priceInGHS) {
        if (!rates || !rates[currency]) return priceInGHS;
        return Number((priceInGHS * rates[currency]).toFixed(2));
    }

    function formatCurrency(value) {
        try {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency,
            }).format(value);
        } catch {
            return value + " " + currency;
        }
    }

    const filteredProducts = shopItems.filter((item) => {
        const matchesSearch = item.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesCategory =
            categoryFilter === "All" || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    if (loading) return <p>Loading shop...</p>;

    return (
        <div className='r1'>
            <main className="r1-back">
                <section id='r3-intro'>
                    <div className="r3 back-heading">
                        <h1>Shop</h1>
                        <p>Party supplies, toys, and decorations available for purchase.</p>
                    </div>
                    <img
                        src="/imgs/blue2.svg"
                        alt="wave overflow"
                        className="absolute top-[500px] left-1/2 transform -translate-x-1/2 w-[1600px] z-60 pointer-events-none"
                    />
                </section>
                <section id='r3-shop-grid' className="relative overflow-visible">
                    <div className='shop-container'>
                        <div className="shop-controls">
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-bar"
                            />

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="category-filter"
                            >
                                <option value="All">All Categories</option>
                                <option value="Household Supplies">Household Supplies</option>
                                <option value="Kid's Toys">Kid's Toys</option>
                                <option value="Party Supplies">Party Supplies</option>
                                <option value="Decor">Decor</option>
                            </select>

                            {/* ✅ Currency Selector */}
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="currency-selector"
                                >
                                {["GHS", "USD", "CAD", "GBP", "EUR", "NGN"].map((cur) => (
                                    <option key={cur} value={cur}>
                                    {cur}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Breadcrumb */}
                        <nav className="breadcrumb">
                            <Link to="/">Home</Link> <FontAwesomeIcon icon={faArrowRightLong} />{"  "}
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

                        <div className='shop-grid'>
                            {filteredProducts.map((item) => (
                                <div key={item.id} className="shop-card">
                                    <div 
                                        className="shop-image"
                                        onClick={() => setLightboxImage(item.image)}
                                    >
                                        <img src={item.image} alt={item.name}/>
                                    </div>
                                    <div className="shop-details">
                                        <h4>{item.category}</h4>
                                        <h3>{item.name}</h3>
                                        <p className="price">
                                            {formatCurrency(convertPrice(item.price))}
                                        </p>
                                        <button className="add-to-cart"
                                            onClick={() => addToCart(item)}
                                            >
                                            <FontAwesomeIcon icon={faShoppingCart} /> Add to Cart
                                        </button>
                                        <button className="add-to-cart-mob"><FontAwesomeIcon icon={faShoppingCart} /></button>
                                    </div>
                                </div>
                            ))}
                            {filteredProducts.length === 0 && (
                                <p className="no-results">No items match your search.</p>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Lightbox Overlay */}
            {lightboxImage && (
                <div className="lightbox" onClick={() => setLightboxImage(null)}>
                    <span className="lightbox-close">
                        <FontAwesomeIcon icon={faTimes} />
                    </span>
                    <img src={lightboxImage} alt="Enlarged product" className="lightbox-img"/>
                </div>
            )}
        </div>
    )
}

export default Shop;
