import React from "react";
import "./Cart.css";
import { AppIcon } from "/src/components/Icon/Icon";
import { faArrowLeft, faGift, faLock, faTruck } from "/src/icons/iconSet";
import { Link } from "react-router-dom";
import { useCart } from "../../components/CartContext/CartContext";
import {
  getCatalogItemBackgroundStyle,
  getCatalogItemImage,
} from "/src/utils/itemMediaBackgrounds";

const normalizeSource = (item) =>
  (item?.sourceCategoryCode || item?.sourcecategorycode || "")
    .toString()
    .trim()
    .toLowerCase();

const isRentalItem = (item) => {
  const source = normalizeSource(item);
  if (source) return source === "rental";
  return (item?.sku || "").toString().toUpperCase().startsWith("REN");
};

const Cart = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    convertPrice,
    formatCurrency,
    clearCart,
  } = useCart();

  const itemCount = cart.reduce((acc, item) => acc + item.cartQuantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
  const convertedSubtotal = convertPrice(subtotal);
  const formattedSubtotal = formatCurrency(convertedSubtotal);
  const getItemQuantity = (item) => item.quantity ?? item.stock ?? 0;
  const getItemCategory = (item) =>
    item.specificCategory || item.specificcategory || item.type || null;
  const hasRentalItems = cart.some((item) => isRentalItem(item));
  const fulfillmentNote = hasRentalItems
    ? "Pickup or delivery confirmed at checkout"
    : "In-store pickup only";

  const handleQtyChange = (item, value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;
    const maxQty = getItemQuantity(item);
    const clamped = Math.min(Math.max(parsed, 1), maxQty);
    updateQuantity(item.id, clamped - item.cartQuantity);
  };

  const stockLeft = (item) =>
    Math.max(getItemQuantity(item) - item.cartQuantity, 0);

  return (
    <main className="cart-shell page-shell" id="main">
      <section className="cart-hero page-hero" id="cart-intro" aria-labelledby="cart-heading">
        <div className="cart-hero-copy back-heading page-hero-copy">
          <p className="cart-hero-kicker">Check out your items</p>
          <h1 id="cart-heading" className="page-hero-title">Your Cart</h1>
          <div className="cart-hero-pills" aria-label="Cart highlights">
            <span className="pill">{itemCount} {itemCount === 1 ? "item" : "items"}</span>
            <span className="pill pill-accent">Subtotal {formattedSubtotal}</span>
          </div>
        </div>
        <div className="cart-hero-card">
          <div className="hero-card-top">
            <div>
              <p className="kicker">Current subtotal</p>
              <strong>{formattedSubtotal}</strong>
            </div>
          </div>
          <div className="hero-card-perks">
            <span><AppIcon icon={faTruck} /> {fulfillmentNote}</span>
            <span><AppIcon icon={faLock} /> Secure checkout</span>
            <span><AppIcon icon={faGift} /> We pack with care</span>
          </div>
        </div>
      </section>

      <section className="cart-body" id="cart-info">
        {cart.length === 0 ? (
          <div className="cart-empty-card">
            <div className="cart-empty-illus" aria-hidden="true">⋆</div>
            <h2>Cart feels a little lonely</h2>
            <p>Add rentals or supplies to see them shine here.</p>
            <div className="cart-empty-actions">
              <Link className="hero-btn hero-btn-primary" to="/Shop">Browse shop</Link>
              <Link className="hero-btn hero-btn-ghost" to="/Rentals">View rentals</Link>
            </div>
          </div>
        ) : (
          <div className="cart-grid cart-page">
            <div className="cart-main">
              <div className="cart-toolbar">
                <div>
                  <p className="kicker">Bag</p>
                  <h3>{itemCount} {itemCount === 1 ? "item" : "items"} saved</h3>
                </div>
                <div className="toolbar-actions">
                  <button className="ghost-btn clear-all" onClick={clearCart}>Clear cart</button>
                  <Link className="pill-link" to="/Shop">
                    <AppIcon icon={faArrowLeft} /> Continue shopping
                  </Link>
                </div>
              </div>

              <div className="cart-list">
                {cart.map((item, index) => (
                  <article
                    className="cart-line"
                    key={item.id}
                    style={{ "--cart-delay": `${Math.min(index, 8) * 0.05}s` }}
                  >
                    <div
                      className="cart-line-media category-image-bg"
                      style={getCatalogItemBackgroundStyle(item)}
                    >
                      <img src={getCatalogItemImage(item)} alt={item.name} loading="lazy" />
                      {getItemCategory(item) && (
                        <span className="cart-chip">{getItemCategory(item)}</span>
                      )}
                    </div>
                    <div className="cart-line-content">
                      <div className="cart-line-top">
                        <div>
                          <h3>{item.name}</h3>
                          <p className="cart-line-stock">
                            {stockLeft(item) > 0
                              ? `${stockLeft(item)} left in stock`
                              : "Reserved to the max"}
                          </p>
                        </div>
                        <button
                          className="pill-link danger"
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name}`}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="cart-line-grid">
                        <div className="cart-line-price">
                          <p className="label">Price</p>
                          <strong>{formatCurrency(convertPrice(item.price))}</strong>
                          <span className="muted">per item</span>
                        </div>

                        <div className="cart-line-qty">
                          <p className="label">Quantity</p>
                          <div className="qty-input">
                            <button
                              type="button"
                              onClick={() =>
                                item.cartQuantity <= 1
                                  ? removeFromCart(item.id)
                                  : updateQuantity(item.id, -1)
                              }
                              aria-label={`Decrease ${item.name} quantity`}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={getItemQuantity(item)}
                              value={item.cartQuantity}
                              onChange={(e) => handleQtyChange(item, e.target.value)}
                              aria-label={`${item.name} quantity`}
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={item.cartQuantity >= getItemQuantity(item)}
                              aria-label={`Increase ${item.name} quantity`}
                            >
                              +
                            </button>
                          </div>
                          <span className="muted">
                            {getItemQuantity(item)} available • {formatCurrency(convertPrice(item.price * item.cartQuantity))}
                          </span>
                        </div>

                        <div className="cart-line-total">
                          <p className="label">Line total</p>
                          <strong>{formatCurrency(convertPrice(item.price * item.cartQuantity))}</strong>
                          <span className="muted">
                            {stockLeft(item) > 0 ? `${stockLeft(item)} spare` : "Max stock reached"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="cart-summary-card" aria-label="Order summary">
              <div className="summary-head">
                <p className="kicker">Summary</p>
                <h3>Ready to book?</h3>
                <p className="muted">Taxes, pickup, and delivery timing are confirmed at checkout.</p>
              </div>
              <div className="summary-rows">
                <div className="summary-row">
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <strong>{formattedSubtotal}</strong>
                </div>
              </div>
              <div className="summary-perks">
                <span><AppIcon icon={faLock} /> Safe checkout</span>
                <span><AppIcon icon={faTruck} /> {fulfillmentNote}</span>
                <span><AppIcon icon={faGift} /> Styled for fun</span>
              </div>
              <Link className="checkout-btn" to="/Checkout">Proceed to Checkout</Link>
              <Link className="ghost-btn summary-continue" to="/Shop">
                Add more items
              </Link>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
};

export default Cart;
