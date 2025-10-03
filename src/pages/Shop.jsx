import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./master.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightLong, faTimes } from "@fortawesome/free-solid-svg-icons";
import AddToCartButton from "/src/components/AddToCartButton";
import CartOverlay from "/src/components/CartOverlay";
import { useCart } from "/src/components/CartContext";

function Shop() {
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [lightboxImage, setLightboxImage] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const { currency, setCurrency, convertPrice, formatCurrency } = useCart();

  // --- Fetch Inventory ---
  useEffect(() => {
    fetch("/.netlify/functions/inventory")
      .then((res) => res.json())
      .then((data) => {
        setInventory(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching inventory:", err);
        setLoading(false);
      });
  }, []);

  const filteredProducts = inventory.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "All" || item.type === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <p>Loading shop...</p>;

  return (
    <div className="r1">
      <main className="r1-back">
        <section id="r3-intro">
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

        <section id="r3-shop-grid" className="relative overflow-visible">
          <div className="shop-container">
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
                {Array.from(new Set(inventory.map((item) => item.type))).map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  )
                )}
              </select>

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

            <div className="shop-grid">
              {filteredProducts.map((item) => (
                <div key={item.id} className="shop-card">
                  <div
                    className="shop-image"
                    onClick={() => setLightboxImage(item.image_url)}
                  >
                    <img
                      src={item.image_url || "/imgs/placeholder.png"}
                      alt={item.name}
                    />
                  </div>
                  <div className="shop-details">
                    <h4>{item.type}</h4>
                    <h3>{item.name}</h3>
                    <p className="price">
                      {formatCurrency(convertPrice(item.price))}
                    </p>
                    <AddToCartButton item={item} />
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
          <img
            src={lightboxImage}
            alt="Enlarged product"
            className="lightbox-img"
          />
        </div>
      )}

      {/* Cart Overlay */}
      <CartOverlay open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

export default Shop;
