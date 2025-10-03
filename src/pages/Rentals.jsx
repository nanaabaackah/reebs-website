import { React, useEffect, useState } from 'react';
import rentalItems from "/src/data/rentalItems.json"
import { Link } from 'react-router-dom';
import './master.css';
import SideNav from '/src/components/SideNav';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
//import { faFolder } from '@fortawesome/free-solid-svg-icons';

function Rentals() {
    const [rentals, setRentals] = useState([]);
    const [currency, setCurrency] = useState("GHS");
    const [rates, setRates] = useState({});
    const [loading, setLoading] = useState(true);

    const apiKey = import.meta.env.VITE_CURRENCY_API_KEY;

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

    useEffect(() => {
        setRentals(rentalItems);
    }, []);

    // Group rentals by category
    const groupedRentals = rentals.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {});

    // Track active section
    const [activeCategory, setActiveCategory] = useState(null);

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
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (loading) return <p>Loading shop...</p>;

    return (
        <div className='r1' id="main" role="main">
            <main className="r1-back">
                <section id='r4-intro'>
                    <div className="r4 back-heading">
                        <h1>Rentals</h1>
                        <p>Party rentals for kids and events.</p>
                    </div>

                    <div className='r4-back-image'>
                        <img src='/imgs/r4.png'  alt="" aria-hidden="true" />
                    </div>

                    {/* Side menu with categories */}
                    <SideNav
                        items={Object.keys(groupedRentals).map((category) => ({
                        id: category,
                        label: category,
                        }))}
                        activeId={activeCategory}
                        label="Rental categories"
                    />
                </section>

                <section id='r4-rent-grid'>
                    {Object.entries(groupedRentals).map(([category, items]) => (
                        <>
                        <div className="shop-controls">
                            {/* Currency Selector */}
                            <label htmlFor="currencySelector" className="sr-only">Select currency</label>
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
                        <div id={category} key={category} className="rent-category-section">
                            <h2>{category}</h2>
                            <div className='rent-grid'>
                                {items.map((item) => (
                                    <div key={item.id} className="rent-card">
                                        <div className="rent-image">
                                            <img src={item.image} alt={item.name}/>
                                        </div>
                                        <div className="rent-details">
                                            <h3>{item.name}</h3>
                                            <h4>{item.category}</h4>
                                            <p className="price">
                                                
                                                 {item.id === 8 
                                                    ? "Contact for more info." 
                                                    : typeof item.price === "string" && item.price.includes("-") ? (
                                                    // Handle price ranges
                                                    (() => {
                                                    const [min, max] = item.price.split("-").map(Number);
                                                    return `${formatCurrency(convertPrice(min))} - ${formatCurrency(convertPrice(max))}`;
                                                    })()
                                                ) : (
                                                    formatCurrency(convertPrice(item.price)))} {item.rate}
                                            </p>
                                            <Link to={item.link} aria-label={`Explore more about ${item.name}`}>Explore More</Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        </>
                    ))}
                </section>
            </main>
        </div>
    );
}

export default Rentals;
